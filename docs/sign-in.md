# Prijava: kod na mejl, Google i Apple

Aplikacija nema lozinke. Nalog se dokazuje **kodom od šest cifara** poslatim na mejl, ili ga
potvrđuje **Google** odnosno **Apple**. Kod radi bez ikakvog naloga kod Google-a ili Apple-a;
dugmad za Google i Apple se pojavljuju tek kad ih projekat podesi — do tada ih nema i aplikacija
radi normalno.

## Kako tok izgleda

| korak            | šta aplikacija radi                                             | backend                                                                     |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| adresa           | „Nastavi"                                                       | `POST /mobile/v1/auth/email/sign-in-code` → `account_exists`, `retry_after` |
| nalog postoji    | ekran za kod, odbrojavanje za „Pošalji ponovo"                  | kod na mejl, 10 min, 5 pokušaja                                             |
| nalog ne postoji | ekran „Novi nalog": korisničko ime, opciono ime, prezime, slika | `email/registration-code`, pa `email/register` sa kodom                     |
| Google / Apple   | sistemski prozor provajdera                                     | `google                                                                     | apple/sign-in`; **404** → „Novi nalog" sa adresom iz tokena (samo za čitanje), bez koda |

Greške se razlikuju **po HTTP statusu**, nikad po tekstu poruke (poruka je serverova, na jeziku
aplikacije, i prikazuje se kako stigne): 404 — nema naloga, registruj; 409 — adresa ima nalog sa
kojim provajder ne sme da se poveže, prijavi se kodom; 422 — pogrešan kod ili token; 429 — sačekaj
(`Retry-After`); 403 — nalog je blokiran; 503 — provajder nije podešen na serveru.
`features/auth/utils/sign-in-errors.ts` to drži na jednom mestu.

Postojeći nalog se automatski povezuje sa Google-om samo za Gmail / Google Workspace adresu, a sa
Apple-om samo za iCloud adresu (`icloud.com`, `me.com`, `mac.com`). Za ostale adrese server odgovara
409 i osoba ulazi kodom — to je zaštita, ne greška.

## Šta traži nalog

|               | bez naloga                                       | sa nalogom                                                                                                                                         |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| prijava kodom | radi lokalno (mejl u `storage/logs` ili Mailpit) | produkcijski SMTP u `api/.env`                                                                                                                     |
| Google        | dugme skriveno                                   | Google Cloud projekat: OAuth consent screen, Web client, iOS client **po varijanti**, Android client **po paketu i SHA-1 svakog potpisnog ključa** |
| Apple         | dugme skriveno                                   | Apple Developer: Sign in with Apple na App ID-jevima, ključ (.p8) za opoziv                                                                        |
| review        | —                                                | demo nalog i kod u App Store Connect / Play Console                                                                                                |

## Google

Podešava se u **Google Cloud Console** (ne treba Firebase), pod nalogom firme ili klijenta — nikad
ličnim.

1. **OAuth consent screen** — ime aplikacije, mejl za podršku, link na politiku privatnosti. Dok je u
   statusu _Testing_, prijava radi samo za naloge dodate kao test korisnici; pre izlaska u prodavnicu
   pređi na _In production_.
2. **Credentials → Create OAuth client ID**, tri vrste:
   - **Web application** — jedan. Njegov ID je `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` u aplikaciji. Google
     ga upisuje u `aud` ID tokena na obe platforme, pa ga backend mora prihvatiti.
   - **iOS** — po jedan za **svaku varijantu**, jer svaka ima svoj bundle ID:
     `com.firma.app.dev`, `com.firma.app.preview`, `com.firma.app`. ID te varijante je
     `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` u njenom okruženju (`.env.local` za dev, EAS environment
     variables za `preview` i `production`). `app.config.ts` iz njega sam pravi `iosUrlScheme`
     (obrnut ID) za config plugin — bez tog ID-ja plugin se ne dodaje i dugme je skriveno.
   - **Android** — po jedan za **svaki paket i svaki SHA-1**. ID-jevi se nigde ne upisuju; Google
     samo proverava da potpis aplikacije odgovara. SHA-1 otisci:
     - lokalni dev build: `cd android && ./gradlew signingReport` (debug ključ),
     - EAS build: `npx eas-cli@latest credentials` → Android → varijanta,
     - Play Store: Play Console → _Release → Setup → App signing_ → _App signing key certificate_
       (Google ponovo potpisuje aplikaciju — bez ovog otiska prijava iz prodavnice ne radi),
     - najsigurnije, na instaliranoj aplikaciji: `npx @react-native-google-signin/config-doctor`.
3. **Backend** (`api/.env`): `GOOGLE_OAUTH_CLIENT_IDS` — svi ID-jevi koje token sme da nosi kao
   `aud`, odvojeni zarezom: Web, pa iOS ID-jevi sve tri varijante.
4. Nov config plugin znači nov native build: `npx expo prebuild --clean`, pa `npm run ios` /
   `npm run android` (ili nov EAS build). Promeni `version` u `app.json`
   ([docs/updates.md](updates.md)).

**`DEVELOPER_ERROR` na Androidu je uvek neslaganje podešavanja** — najčešće SHA-1 koji nije dodat
(drugi ključ, Play App Signing) ili `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` koji nije tipa _Web_.

## Apple

App Store traži Sign in with Apple čim aplikacija nudi Google prijavu.

1. **Apple Developer → Identifiers** — na App ID-ju svake varijante uključi _Sign in with Apple_.
   EAS to radi sam pri buildu (capabilities sync); lokalni build na simulatoru ne traži potpis.
2. U aplikaciji: `EXPO_PUBLIC_APPLE_SIGN_IN=true`. Tek tada `app.config.ts` dodaje plugin
   `expo-apple-authentication` (entitlement) i `ios.usesAppleSignIn`, a dugme se prikazuje na iOS-u
   gde ga sistem podržava. Bez toga App ID bez te mogućnosti ne može ni da se potpiše.
3. **Backend**: `APPLE_CLIENT_IDS` — bundle ID-jevi sve tri varijante, odvojeni zarezom (to je `aud`
   identity tokena). Dovoljno za prijavu.
4. **Opoziv pri brisanju naloga** (App Review ga traži): _Keys_ → novi ključ sa _Sign in with Apple_,
   preuzmi `.p8` (samo jednom!). U `api/.env` (nikad u git): `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
   `APPLE_PRIVATE_KEY_BASE64` (`base64 -i AuthKey_XXXX.p8 | tr -d '\n'`). Bez ključa prijava radi,
   samo se Apple ovlašćenje ne opoziva pri brisanju naloga.
5. **Mejl na skrivene adrese** (`…@privaterelay.appleid.com`): Apple ih prosleđuje samo sa domena
   registrovanih u _Services → Sign in with Apple for Email Communication_. Registruj domen sa kog
   backend šalje mejl.

Detalji koje aplikacija već radi: **nonce** (nasumična vrednost; Apple dobija njen SHA-256, server
dobija sirovu vrednost i proverava), ime iz prvog odobrenja (Apple ga šalje samo jednom — popunjava
polja na registraciji), i ponovno Apple odobrenje na brisanju naloga radi svežeg koda za opoziv —
ako ga osoba otkaže, brisanje se ipak nastavlja.

## Review nalog i Maestro

App Store i Google Play recenzenti ne mogu da čitaju tuđi mejl. Zato backend ima **demo naloge**:

```sh
# api/.env
MOBILE_DEMO_EMAILS=review@firma.com
MOBILE_DEMO_CODE=482913
```

```sh
make artisan c="mobile:demo-accounts"
```

Nalozi sa tih adresa dobijaju fiksni kod i ne dobijaju mejl; adresa sa liste koja još nema nalog
može i da se registruje istim kodom. Pravi nalog nikad ne može da dobije fiksni kod. Komandu pusti
pre svake predaje na review — recenzent ume da obriše nalog. U App Store Connect (_App Review
Information_) i Play Console (_App access_) upiši adresu i kod sa uputstvom: „Unesite adresu,
dodirnite Nastavi, pa unesite kod".

Isti mehanizam koriste Maestro tokovi lokalno (adrese `maestro*@example.com`, kod `424242` — vidi
README). Limiteri backenda (5 kodova na sat po adresi, 20 po IP-ju) važe i za njih: između dva puna
prolaza na obe platforme isprazni keš (`make artisan c="cache:clear"`).

## Bez naloga, na uređaju

Google i Apple prijava se stvarno proveravaju tek sa nalozima, na uređaju (Apple na simulatoru radi
samo delimično). Do tada su konfiguracija i backend provera testirani (Jest, PHPUnit sa lažnim
ključevima), ali sam nalog nije — isto kao push i OTA.
