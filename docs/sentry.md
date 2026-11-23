# Sentry — prijave grešaka, podešavanje u projektu

Template je namerno **nevezan** za bilo koji Sentry nalog, kao i za Expo i Firebase (vidi
`push-notifications.md`). Kod je kompletan i testiran; dok je `EXPO_PUBLIC_SENTRY_DSN` prazan,
ništa se ne inicijalizuje i ništa se ne šalje. Za stvarne prijave projekat napravljen iz
template-a jednom prolazi korake ispod.

> **Ovo se radi u projektu, nikad u template-u.** DSN, organizacija i token pripadaju
> projektu. U `app.json` se ne upisuje ništa — sve ide kroz `.env.local` i EAS env promenljive,
> koje čita `app.config.ts`.

## Šta ti treba

**Sentry nalog po projektu** — bez njega aplikacija radi normalno, ali greške koje korisnici
dobiju ne vidi niko. Nalog otvara klijent ili firma, na organizaciju, ne lični: uz njega idu
prijave grešaka sa imenima korisnika (id-jevima) i pristup treba da ostane kad se tim promeni.

| Za                  | Treba                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| prijave grešaka     | Sentry organizacija + projekat (platforma React Native); besplatan plan: 5.000 grešaka mesečno |
| čitljiv stack trace | organizacioni auth token (za upload source map-a)                                              |
| EAS build-ove       | Expo nalog projekta (`eas init`) — vidi `push-notifications.md`, korak 0                       |

## Ukratko: šta je minimum

| Šta                            | Gde                                          | Zašto                                               |
| ------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| `EXPO_PUBLIC_SENTRY_DSN`       | `.env.local` + EAS (plaintext)               | bez njega aplikacija ne šalje ništa                 |
| `SENTRY_ORG`, `SENTRY_PROJECT` | `.env.local` + EAS (plaintext)               | bez njih release build preskače upload source map-a |
| `SENTRY_AUTH_TOKEN`            | **samo** EAS (secret) ili `export` u shell-u | bez njega release build preskače upload (ne puca)   |

Bez source map-a greške i dalje stižu, ali sa minifikovanim stack trace-om (`index.android.bundle:1:48213`)
— upotrebljivo samo za poruku, ne za liniju koda.

---

## Šta se šalje, a šta ne

Šalje se, **samo iz release build-a** (EAS build, `--configuration Release`, `--variant release`):

- **pad aplikacije** — neuhvaćena JS greška i native crash (iOS i Android);
- **ekran koji pukne pri renderovanju** — `ErrorScreen` ga prikaže korisniku i prijavi
  (`features/shared/components/error-screen.tsx`);
- **neuspeo API poziv koji je bag** (`reportQueryError` u `lib/query-client.ts`):
  - 5xx, sa tagom `request_id` — isti id koji backend piše u log, pa se iz Sentry-ja jednim
    pretraživanjem stiže do linija u Grafani;
  - sve što nije `ApiError`: odgovor koji Zod šema odbije (API promenio oblik) ili izuzetak u
    našem kodu.

Ne šalje se:

- **4xx** — to je API koji odgovara (pogrešna lozinka, 403, 422), ne bag;
- **status 0** — telefon bez mreže;
- **iz development build-a** — nikad, čak ni sa DSN-om. Crveni ekran kod developera nije incident.

Uz grešku ide **samo id korisnika** (`setReportedUser` u session store-u), bez imejla, IP adrese i
header-a (`sendDefaultPii: false`). Na odjavi se briše.

Kad u novom kodu uhvatiš grešku koja znači bag, prijavi je kroz `reportError` iz `@/lib/sentry` —
nikad direktno iz `@sentry/react-native`.

---

## Podešavanje (jednom po projektu)

### 1. Sentry projekat

Na [sentry.io](https://sentry.io) (besplatan plan: 5.000 grešaka mesečno), u organizaciji kojoj
projekat pripada: **Projects → Create Project → React Native**. Zapiši:

- **DSN** — Project Settings → Client Keys (DSN);
- **organization slug** — Organization Settings;
- **project slug** — ime projekta iz liste.

DSN nije tajna: on samo dozvoljava slanje događaja u taj projekat, zato sme da bude `EXPO_PUBLIC_`.

### 2. Auth token za upload

**Settings → Developer Settings → Organization Tokens → Create New Token.** Organizacioni token je
automatski ograničen na upload source map-a i pravljenje release-a. **Ovo jeste tajna** — nikad
u `.env.local`, `.env.example`, `app.json` ni u bilo koji fajl u repou.

### 3. Lokalno — `.env.local`

```
EXPO_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
SENTRY_ORG=ime-organizacije
SENTRY_PROJECT=ime-projekta
```

### 4. EAS — env promenljive

Iz foldera mobilne aplikacije (projekat mora već biti povezan sa EAS-om, `eas init` — vidi
`push-notifications.md`, korak 0):

```sh
npx eas-cli@latest env:set --name EXPO_PUBLIC_SENTRY_DSN --value "https://..." \
  --visibility plaintext --environment production --environment preview
npx eas-cli@latest env:set --name SENTRY_ORG --value ime-organizacije \
  --visibility plaintext --environment production --environment preview
npx eas-cli@latest env:set --name SENTRY_PROJECT --value ime-projekta \
  --visibility plaintext --environment production --environment preview
npx eas-cli@latest env:set --name SENTRY_AUTH_TOKEN --value "sntrys_..." \
  --visibility secret --environment production --environment preview
```

`environment` u Sentry-ju je varijanta aplikacije (`development`, `preview`, `production` —
`docs/builds.md`), pa se greške testera ne mešaju sa produkcijskim. Ne podešava se posebno.

### 5. Ponovo izgradi aplikaciju

Sentry plugin je uvek uključen, ali organizacija i projekat ulaze u native projekat tek pri
`prebuild`-u, pa lokalno posle popunjavanja `.env.local` treba novi native projekat (EAS ga ionako
pravi iz početka za svaki build):

```sh
npx expo prebuild --clean
npm run ios      # ili: npm run android
```

## Provera

1. Privremeno dodaj dugme na neki ekran — **ne commit-uj ga**:

   ```tsx
   <Button
     title="Sentry test"
     onPress={() => {
       throw new Error('Sentry test');
     }}
   />
   ```

2. Napravi **release** build sa tokenom u shell-u (development build ne šalje):

   ```sh
   export SENTRY_AUTH_TOKEN=sntrys_...
   npx expo run:ios --configuration Release
   npx expo run:android --variant release
   ```

3. Pritisni dugme, ponovo otvori aplikaciju (događaj se šalje i pri sledećem pokretanju, ako
   pad prekine slanje).
4. U Sentry-ju → **Issues** treba da stoji `Error: Sentry test` sa stack trace-om koji pokazuje
   **naš fajl i liniju** (`src/features/...`). Ako pokazuje `index.bundle:1:...`, source map nije
   otpremljen — u logu build-a potraži `SENTRY_DISABLE_AUTO_UPLOAD`: znači da token nije bio
   postavljen.

Ukloni dugme.

## EAS Update (kad ga projekat uvede)

`eas update` ne prolazi kroz native build, pa source map-e ne otprema sam. Posle svakog update-a:

```sh
npx eas-cli@latest update --branch production && npx sentry-expo-upload-sourcemaps dist
```

Skripta čita `SENTRY_ORG`, `SENTRY_PROJECT` i `SENTRY_AUTH_TOKEN` iz okruženja. Kad se doda
`expo-updates`, u `initSentry` je korisno dodati tagove `expo-update-id` i
`expo-is-embedded-update` — recept je na <https://docs.expo.dev/guides/using-sentry/>.

## Kad ne radi

| Simptom                                                  | Uzrok                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Ništa ne stiže iz `npm run ios` / `android`              | to su development build-ovi — namerno ne šalju                                                |
| Ništa ne stiže ni iz release build-a                     | `EXPO_PUBLIC_SENTRY_DSN` nije bio postavljen **pri build-u** (inline-uje se tada)             |
| Stack trace minifikovan                                  | nema `SENTRY_AUTH_TOKEN` pri build-u, ili posle `eas update` nije pušten upload               |
| Metro upozorava „Sentry native configuration is missing" | `ios/` / `android/` su napravljeni pre nego što je Sentry dodat — `npx expo prebuild --clean` |
