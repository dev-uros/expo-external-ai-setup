# Jezik

Aplikacija govori **srpski (latinica)** i **engleski**. Počinje na srpskom, bez obzira na jezik
telefona; osoba bira engleski u Podešavanjima ili već na ekranu dobrodošlice.

## Gde je šta

|                               |                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/i18n/sr.json`, `en.json` | svi tekstovi aplikacije, po feature-ima (`auth.code.title`)                                             |
| `src/lib/i18n.ts`             | i18next: podrazumevani jezik, `INTL_LOCALES`, `t()` za kod van komponenti                               |
| `src/i18n/i18next.d.ts`       | ključevi se proveravaju prema `sr.json` — `t('pogresan.kljuc')` ne prolazi `tsc`                        |
| `features/language/`          | izbor jezika: čuva se na uređaju, primenjuje pre prvog prikaza                                          |
| `src/i18n/native/*.json`      | tekstovi koje prikazuje **sistem** (dozvole za kameru i galeriju na iOS-u), kroz `locales` u `app.json` |

## Pravila

- **Svaki tekst na ekranu ide kroz `t()`** — u komponenti `useTranslation()`, van nje `t` iz
  `@/lib/i18n`. Zod poruke su funkcije (`{ error: () => t('…') }`), da se čitaju na jeziku trenutka
  greške, ne učitavanja modula.
- **Poruke servera se prikazuju kako stignu.** Backend već odgovara na jeziku aplikacije: svaki
  zahtev nosi `Accept-Language` (`src/lib/http.ts`), a validacija i nazivi polja su prevedeni na
  serveru.
- **Množina kroz i18next**, nikad ručno: srpski ima `_one`, `_few`, `_other`
  (`"resend_in_one": "… {{count}} sekundu"`, `_few`: „sekunde", `_other`: „sekundi"), engleski
  `_one` i `_other`. Poziva se sa `count`: `t('auth.code.resend_in', { count })`.
- **Datumi i brojevi kroz `Intl` sa `intlLocale()`** (`sr-Latn-RS` / `en-GB`) —
  `features/shared/utils/dates.ts`. Gola `sr` ili `sr-RS` daje **ćirilicu**.
- **Nov ključ ide u oba fajla.** `src/i18n/translations.test.ts` pada kad se ključevi razlikuju (oblici
  množine se ne računaju kao razlika).

## Promena jezika

`useChangeLanguage()` (`features/language`):

1. menja jezik i18next-a — svi ekrani se odmah iscrtaju ponovo;
2. čuva izbor na uređaju (`expo-sqlite/kv-store`) — preživljava restart i odjavu;
3. osvežava sve upite (`invalidateQueries()`), jer server prevodi ono što šalje;
4. ako je neko prijavljen, javlja serveru (`PATCH /mobile/v1/me` sa `locale`), pa **mejlovi i push
   obaveštenja** stižu na istom jeziku. Ako to ne uspe (offline), promena ostaje — sledeći zahtev ionako
   nosi jezik, a sledeća prijava ga upisuje na nalog.

## Sistemski tekstovi (iOS)

Tekstove dozvola prikazuje sistem, ne aplikacija, pa ne mogu kroz i18next. Pišu se u
`src/i18n/native/sr.json` i `en.json` pod ključem `ios` (`NSCameraUsageDescription`,
`NSPhotoLibraryUsageDescription`) i ulaze u build kroz `locales` u `app.json`; iOS bira fajl po jeziku
telefona. `CFBundleAllowMixedLocalizations` (u `app.json`) to omogućava. Nov tekst dozvole = nov
native build. Na Androidu sistem ove tekstove ne prikazuje.

## Treći jezik

Novi `src/i18n/<kod>.json` sa svim ključevima, dodaj ga u `LANGUAGES`, `resources` i `INTL_LOCALES`
u `lib/i18n.ts`, ime jezika (`language.names.<kod>`) u sve fajlove, i u backendu `AppLocale` enum,
`lang/<kod>/*.php` i `SetLocale`.
