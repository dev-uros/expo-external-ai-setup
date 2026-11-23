# Build-ovi i varijante — dev, test i produkcija na istom telefonu

Iz istog koda prave se **tri aplikacije** koje mogu da stoje jedna pored druge na istom telefonu.
Telefon drži jednu aplikaciju po bundle id-ju, pa svaka varijanta ima svoj:

| Varijanta (`APP_VARIANT`) | Ime ispod ikonice | Bundle id / package    | Šema             | Za koga                                      |
| ------------------------- | ----------------- | ---------------------- | ---------------- | -------------------------------------------- |
| `development`             | „Ime (Dev)"       | `<id>.dev`             | `<šema>-dev`     | developer: dev build, Metro, hot reload      |
| `preview`                 | „Ime (Test)"      | `<id>.preview`         | `<šema>-preview` | testeri i klijent: prava aplikacija, staging |
| `production`              | „Ime"             | `<id>` (iz `app.json`) | `<šema>`         | korisnici: App Store i Google Play           |

`<id>` je `ios.bundleIdentifier` / `android.package` iz `app.json` — to su produkcijske vrednosti,
a `app.config.ts` dodaje sufiks za ostale dve. Šema je iz `app.json` (`scheme`); svaka varijanta
ima svoju da link ne bi otvorio pogrešnu aplikaciju. `slug` je isti za sve tri — jedan projekat na
expo.dev.

Šemu za otvaranje dev servera (`exp+<slug>://`, njome Metro i Maestro otvaraju dev build) ima
**samo** dev varijanta. Ostavljena na podrazumevanom, `expo-dev-client` bi je dodao u sve tri, pa
bi Android na svaki link ka Metro-u pitao „Open with…" i Maestro flowovi bi pucali.

Varijanta određuje još:

- **API** — svaka varijanta gađa svoj backend (`EXPO_PUBLIC_API_URL` po EAS okruženju, vidi ispod);
- **Sentry `environment`** — greške testera se ne mešaju sa produkcijskim (`docs/sentry.md`);
- **iOS push okruženje** — `development` ide preko Apple-ovog sandbox-a, `preview` i `production`
  preko produkcijskog (`docs/push-notifications.md`).

Nepoznata vrednost `APP_VARIANT` prekida build sa porukom; prazna znači `production`.

---

## Lokalno (bez ikakvog naloga)

`.env.local` ima `APP_VARIANT=development`, pa je sve što se pokreće lokalno dev varijanta:

```sh
npm run ios          # dev build na iOS simulatoru
npm run android      # dev build na Android emulatoru
npm start            # samo Metro, kad je dev build već instaliran
```

**Druga varijanta lokalno** — npr. da proveriš kako izgleda prava, produkcijska aplikacija pored
dev-a. Promenljiva iz shell-a ima prednost nad `.env.local`. `expo run:*` ne usklađuje postojeći
`ios/` / `android/` folder sa novom varijantom, pa prvo `prebuild --clean`:

```sh
APP_VARIANT=production npx expo prebuild --clean
APP_VARIANT=production npx expo run:android --variant release
APP_VARIANT=production npx expo run:ios --configuration Release
```

Release build nosi JS u sebi (ne treba mu Metro) i gađa `EXPO_PUBLIC_API_URL` iz `.env.local`.
Android release lokalno potpisuje debug ključem — za instalaciju na emulator/telefon je dovoljno,
za prodavnicu nije. Posle toga vrati native foldere na dev varijantu:

```sh
npx expo prebuild --clean
```

---

## Na Expo serverima — EAS Build (treba nalog)

`eas.json` ima četiri profila:

| Profil                  | Varijanta     | Šta pravi                                                            |
| ----------------------- | ------------- | -------------------------------------------------------------------- |
| `development`           | `development` | dev build za telefon (interna distribucija)                          |
| `development-simulator` | `development` | isto, za iOS simulator                                               |
| `preview`               | `preview`     | prava aplikacija za testere; Android kao APK (instalira se direktno) |
| `production`            | `production`  | za prodavnice (AAB / IPA), build broj se sam povećava                |

Komande (iz foldera mobilne aplikacije):

```sh
npm run build:dev                          # pita za platformu
npm run build:preview -- --platform android
npm run build:production -- --platform all
npm run submit:production -- --platform ios
npx eas-cli@latest build --profile development-simulator --platform ios
```

Svaki profil postavlja `APP_VARIANT` i bira istoimeno **EAS okruženje** (`development`,
`preview`, `production`) iz kog build dobija env promenljive. `.env.local` se ne šalje na Expo
servere (git-ignored), pa sve što build treba mora da postoji tamo.

### Jednom po projektu

1. **Expo nalog i projekat** — `npx eas-cli@latest init` (organizacija, ne lični nalog), pa
   `EAS_PROJECT_ID` i `EXPO_OWNER` u `.env.local` i u sva tri EAS okruženja.
   Tačni koraci: `docs/push-notifications.md`, koraci 0 i 1. Pre toga u `app.json` postavi pravi
   bundle id / package — **sve tri varijante ga nasleđuju**, a promena kasnije znači nove
   kredencijale za sve tri.
2. **API po okruženju:**

   ```sh
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://staging-api.example.com/api \
     --environment preview --visibility plaintext
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://api.example.com/api \
     --environment production --visibility plaintext
   ```

   Za `development` nije potrebno: dev build JS uzima od Metro-a na tvom računaru, sa tvojim
   `.env.local`.

3. **Kredencijali** — prvi build svake varijante na svakoj platformi pita da li da EAS napravi
   kredencijale (Android keystore, iOS sertifikat i provisioning profil) — odgovor „da". Svaka
   varijanta ima svoj bundle id, pa i svoje kredencijale; to je očekivano. Produkcijski Android
   keystore je identitet aplikacije na Google Play-u: čuva ga EAS, a rezervna kopija se skida sa
   `npx eas-cli@latest credentials` → Android → production → Download.

### Instalacija na telefon

- **Android** (`development`, `preview`): link ili QR kod sa expo.dev posle build-a, APK se
  instalira direktno. Telefon ne treba da se registruje.
- **iOS** (`development`, `preview`): interna distribucija je ad hoc — radi samo na
  **registrovanim** uređajima. Pre build-a registruj telefon (`npx eas-cli@latest device:create`,
  telefon otvori link i instalira profil); uređaj dodat posle build-a traži novi build.
  Treba plaćen Apple Developer nalog.
- **Produkcija** ide kroz prodavnice: `npm run submit:production`. Za iOS je potrebna aplikacija u
  App Store Connect-u (TestFlight je odmah posle submit-a). Za Android, Google Play traži da se
  **prva** verzija nove aplikacije postavi ručno kroz Play Console; posle toga radi `submit`.

### Verzije

`appVersionSource: remote` — build brojeve (iOS `buildNumber`, Android `versionCode`) vodi EAS i
`production` profil ih povećava sam. Verziju koju korisnik vidi (`version` u `app.json`, npr.
`1.2.0`) menjaš ručno pre izdanja.

---

## Šta traži nalog

| Šta                                             | Treba                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| sve tri varijante lokalno (simulator, emulator) | ništa                                                                  |
| lokalni release build na Android telefon (kabl) | ništa                                                                  |
| bilo koji build na Expo serverima               | Expo nalog — organizacija, `eas init`                                  |
| dev ili preview build na iPhone                 | + plaćen Apple Developer nalog, registrovan uređaj                     |
| App Store / TestFlight                          | + aplikacija u App Store Connect-u                                     |
| Google Play                                     | Google Play Developer nalog (jednokratno plaćanje), prva verzija ručno |
| push u bilo kojoj varijanti                     | vidi `docs/push-notifications.md`                                      |
| prijave grešaka                                 | vidi `docs/sentry.md`                                                  |
