# Push obaveštenja — podešavanje u projektu

Template je namerno **nevezan** za bilo koji Expo nalog, Firebase projekat ili Apple tim. Sve
što ne zavisi od naloga radi odmah; za stvarno slanje obaveštenja projekat napravljen iz
template-a mora jednom da prođe korake ispod.

> **Ovo se radi u projektu, nikad u template-u.** Nalozi i ključevi pripadaju klijentu i
> projektu; template ostaje bez `EAS_PROJECT_ID`, bez `google-services.json` i bez ičijeg
> `owner`-a. Podrška je kompletna — aplikacija, backend i testovi — nedostaju samo nalozi.

## Ukratko: šta je minimum

Bez ovoga nema smislene provere — telefon ne dobija token, pa server nema kome da pošalje:

| Šta                                       | Zašto                                    | Platforma |
| ----------------------------------------- | ---------------------------------------- | --------- |
| EAS projekat → `EAS_PROJECT_ID`           | bez njega telefon ne dobija Expo token   | obe       |
| `google-services.json` u build-u          | bez njega Android ne dobija token        | Android   |
| FCM V1 service account ključ na expo.dev  | bez njega Expo ne može da dostavi poruku | Android   |
| APNs ključ (plaćen Apple Developer nalog) | iOS build-u za token, Expo-u za dostavu  | iOS       |

**Platforme se podešavaju odvojeno.** Najjeftinija prva provera je **samo Android**: Expo nalog i
besplatan Firebase projekat, bez Apple naloga (koraci 0, 1, 2, 4, pa „Provera"). Kad tu prođe ceo
put — token u bazi → „Pošalji probno obaveštenje" → obaveštenje stigne — backend i aplikacija su
potvrđeni, a iOS posle toga traži samo APNs ključ (korak 3) i novi build.

Šta template **ne radi**, jer zavisi od projekta:

- **tap na obaveštenje** samo otvara aplikaciju; navigacija na ekran po `data` (npr.
  `{ type: 'task', id: 42 }`) dodaje se kad projekat zna šta šalje. Root layout već čeka proveru
  tokena pre rutiranja, upravo da se link iz obaveštenja ne izgubi;
- **Android ikonica u status baru**: plugin `expo-notifications` u `app.json` ima samo boju. Dodaj
  belu, monohromnu PNG ikonicu 96×96 s providnom pozadinom kao opciju `icon` — bez nje Android
  može da prikaže sivi kvadrat.

Samo za **interne** korisnike (tabela `users`, uređaji u `internal_user_devices`). Eksterna
aplikacija, kad je projekat bude imao, ima svoje naloge, svoju tabelu uređaja i svoj način
prijave.

---

## Šta radi bez ikakvog podešavanja

- **Prijava** šalje podatke o telefonu; backend upisuje red u `internal_user_devices` vezan za
  token te sesije.
- **Odmah posle prve prijave** na instalaciji sistem pita za dozvolu za obaveštenja. Automatski
  se pita samo jednom po instalaciji — iOS ionako prikazuje sistemski prompt samo jednom, a na
  Androidu pitanje pri svakom pokretanju posle „ne" je dosađivanje.
- **Profil → Obaveštenja** prikazuje telefon i stanje, i nudi jednu radnju:

  | Stanje                                                     | Dugme                        |
  | ---------------------------------------------------------- | ---------------------------- |
  | Uključena na ovom uređaju.                                 | Pošalji probno obaveštenje   |
  | Dozvoljena, ali slanje obaveštenja još nije podešeno …     | — (nema EAS projekta)        |
  | Dozvoljena, ali uređaj još nije prijavljen za obaveštenja. | Pokušaj ponovo               |
  | Isključena na ovom uređaju.                                | Uključi obaveštenja (prompt) |
  | Isključena. Uključite ih u podešavanjima telefona.         | Otvori podešavanja           |

  „Isključena … podešavanjima" znači da sistem više ne sme da pita (iOS posle prvog odbijanja,
  Android posle drugog) — jedini put nazad je aplikacija Podešavanja. Kad se korisnik vrati u
  aplikaciju, dozvola se ponovo čita i promena odmah ide na server.

- **Odjava gasi push na tom telefonu** bez ikakvog poziva iz aplikacije: backend odvezuje uređaj
  kad se token obriše (odjava, reset lozinke, isključen nalog).

Dok koraci ispod nisu urađeni, profil posle dozvole kaže „Dozvoljena, ali slanje obaveštenja
još nije podešeno za ovu aplikaciju." — to je očekivano stanje template-a.

---

## Šta ti treba

| Za                 | Treba                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| sve                | Expo nalog, najbolje firmina **organizacija** na expo.dev                           |
| Android            | Firebase projekat (besplatan)                                                       |
| iOS                | **plaćen** Apple Developer nalog (APNs ključ)                                       |
| testiranje Android | fizički telefon ili emulator sa **Google Play** sistemskom slikom                   |
| testiranje iOS     | fizički iPhone, ili simulator (Xcode 14+, Apple silicon) — dostava ide preko APNs-a |

---

## Koraci

### 0. Identitet aplikacije

`expo.name` (ime ispod ikonice i u tekstovima dozvola) već je ime projekta — upisao ga je
`new-project.sh`. U `app.json` zameni preostale template vrednosti pravim:

- `expo.slug` — kako će se projekat zvati na expo.dev;
- `expo.ios.bundleIdentifier` i `expo.android.package` — `com.example.backoffice` je samo
  placeholder. Firebase i Apple vezuju kredencijale baš za ove vrednosti, pa ih postavi **pre**
  koraka 2 i 3. Promena posle toga znači nove kredencijale.

To su **produkcijske** vrednosti; dev i test varijanta dobijaju sufiks `.dev` i `.preview`
(`docs/builds.md`). Za push je svaka varijanta zasebna aplikacija — Firebase i Apple je moraju
znati pod njenim id-jem (koraci 2 i 3).

Ažuriraj i `appId` u Maestro flowovima (`.maestro/**/*.yaml`) na novi id **sa `.dev`** (flowovi
testiraju dev build), a
kad menjaš `slug`, i šemu `exp+expo-mobile-ai-setup://` u `.maestro/shared/open-dev-server.yaml`
(development build je izvodi iz slug-a: `exp+<slug>`).

### 1. EAS projekat → `EAS_PROJECT_ID`

```sh
npx eas-cli@latest login
npx eas-cli@latest init     # izaberi organizaciju; napravi ili poveži projekat
```

Konfiguracija je dinamička (`app.config.ts` čita env), pa `eas init` ne može sam da upiše id u
`app.json` — ispisaće ga i zamoliti da ga dodaš ručno. **Ne upisuj ga u `app.json`**, nego u env:

```sh
# .env.local (git-ignored) — za lokalni rad i `expo start`
EAS_PROJECT_ID=<uuid sa expo.dev → Project settings>
EXPO_OWNER=<organizacija ili nalog>
```

i iste dve promenljive na expo.dev (za build-ove na Expo serverima), vidljivost „Plain text",
u sva tri okruženja:

```sh
npx eas-cli@latest env:set --name EAS_PROJECT_ID --value <uuid> \
  --environment development --environment preview --environment production --visibility plaintext
npx eas-cli@latest env:set --name EXPO_OWNER --value <org> \
  --environment development --environment preview --environment production --visibility plaintext
```

Provera: `npx expo config --type public` mora da pokaže `extra.eas.projectId`.

### 2. Android — Firebase (FCM V1)

1. [Firebase Console](https://console.firebase.google.com) → novi projekat (ili postojeći
   firmin za ovog klijenta).
2. **Add app → Android** tri puta, po jednom za svaku varijantu: package name =
   `expo.android.package` iz koraka 0, pa isti sa `.dev`, pa sa `.preview`. Jedan Firebase
   projekat drži sve tri. **Posle** dodavanja sve tri preuzmi **`google-services.json`** (sadrži
   sve tri aplikacije — fajl preuzet ranije ne zna za ostale i taj build pada) i stavi ga u koren
   mobilnog projekta. `app.config.ts` ga sam
   pronalazi. Sadrži samo javne identifikatore i sme da se commituje.
   - Ako ga ne commituješ: na expo.dev ga postavi kao **file** env promenljivu
     `GOOGLE_SERVICES_JSON` — `app.config.ts` je čita pre lokalnog fajla.
3. **Project settings → Service accounts → Generate new private key**. To je **tajni** ključ:
   ne ide u repo (`.gitignore` već hvata `*firebase-adminsdk*.json` i `service-account*.json`).
4. Upload ključa na Expo:
   ```sh
   npx eas-cli@latest credentials
   # Android → production → Google Service Account
   #   → Manage your Google Service Account Key for Push Notifications (FCM V1)
   #   → Set up … → Upload a new service account key
   ```
   (Isto može na expo.dev → Project → Credentials → Android → FCM V1 service account key.)
5. Ako je API ključ u `google-services.json` ograničen u Google Cloud Console, dozvoli mu
   **FCM Registration API** i **Firebase Installations API** — inače telefon nikad ne dobije
   token (`403 PERMISSION_DENIED` u logu).

### 3. iOS — APNs

Treba plaćen Apple Developer nalog (tim firme).

```sh
npx eas-cli@latest credentials
# iOS → (profil) → Push Notifications: Manage your Apple Push Notifications Key
#   → Set up a Push Key → generiši novi (ili izaberi postojeći ključ tima)
```

Prvi `eas build` za iOS takođe nudi ovo („Setup Push Notifications for your project" → da). Jedan
APNs ključ važi za ceo tim, pa pokriva sve tri varijante; svaka varijanta (bundle id) samo dobija
svoj provisioning profil sa uključenim push-om — prvi build svake to pita.

`aps-environment` (Apple-ov sandbox ili produkcija) `app.config.ts` postavlja sam po varijanti:
`development` → sandbox, `preview` i `production` → produkcija. Ne menjaj `mode` u `app.json`.

Za fizički iPhone uređaj mora biti registrovan (`npx eas-cli@latest device:create`) pre development
build-a.

### 4. Ponovo izgradi aplikaciju

Promene u config-u (Firebase fajl, entitlements) ulaze tek u novi native build:

```sh
npx expo prebuild --clean
npm run ios
npm run android
```

ili `npm run build:dev` / `build:preview` za build na Expo serverima (`docs/builds.md`).

### 5. Backend

Ništa obavezno:

- slanje je **u redu čekanja** — `horizon` kontejner mora da radi (`make up` ga diže); posle
  izmene koda notifikacije `make horizon-restart`;
- `EXPO_ACCESS_TOKEN` u `api/.env` treba **samo** ako na expo.dev uključiš
  _Enhanced security for push notifications_ (Project settings → Push). Tada napravi access token
  na expo.dev i upiši ga tamo; bez toga Expo odbija slanje.

---

## Provera

1. Obriši aplikaciju sa uređaja (da se automatski prompt ponovo pojavi), instaliraj novi build,
   prijavi se, dozvoli obaveštenja.
2. Profil → Obaveštenja mora da kaže **„Uključena na ovom uređaju."**.
3. **Pošalji probno obaveštenje** → obaveštenje „Probno obaveštenje" stiže na taj telefon (samo na
   njega, ne i na ostale telefone istog naloga).
4. U bazi: `select device_id, platform, expo_push_notification_token, personal_access_token_id
from internal_user_devices;` — token `ExponentPushToken[…]`, sesija popunjena.

Maestro: `.maestro/notifications/this-device.yaml` u template-u očekuje stanje „nije podešeno".
Kad je projekat podešen, zameni te dve provere sa „Uključena na ovom uređaju." i dodaj tap na
„Pošalji probno obaveštenje" + proveru toasta „Probno obaveštenje je poslato.".

---

## Slanje iz backend koda

Korisnik je notifiable preko kanala `expo`; `User::routeNotificationForExpo()` vraća tokene svih
njegovih telefona koji imaju dozvolu **i** živu sesiju.

```php
class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return [ExpoChannel::class];
    }

    public function toExpo(object $notifiable): ExpoMessage
    {
        return ExpoMessage::create('Novi zadatak')
            ->body('Dodeljen vam je zadatak.')
            ->playSound()
            ->data(['type' => 'task', 'id' => 42]);
    }
}

$user->notify(new TaskAssignedNotification);
```

Uzor je `app/Notifications/TestPushNotification.php`. Telefon koji Expo prijavi kao
`DeviceNotRegistered` (aplikacija obrisana, obaveštenja ugašena) gubi token sam
(`ForgetUnregisteredExpoToken`).

---

## Kad ne radi

| Simptom                                          | Uzrok                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Profil: „… još nije podešeno za ovu aplikaciju." | `EAS_PROJECT_ID` nije stigao u build — proveri `npx expo config --type public`, restartuj Metro |
| Profil: „… uređaj još nije prijavljen" (Android) | nema `google-services.json` u build-u, ili emulator bez Google Play servisa                     |
| Isto na iOS-u                                    | nema APNs ključa na expo.dev, ili build nije rađen posle dodavanja                              |
| Probno obaveštenje: 409                          | server nema token za ovaj telefon — vidi dva reda iznad                                         |
| Toast „poslato", a ništa ne stiže                | `horizon` ne radi, ili Expo odbija (`storage/logs`, Horizon → Failed jobs)                      |
| `InvalidCredentials` u logu                      | FCM V1 ključ nije uploadovan (Android) / APNs ključ (iOS)                                       |
| Prompt se ne pojavljuje                          | već je pitano na ovoj instalaciji — obriši aplikaciju, ili dugme na profilu                     |
