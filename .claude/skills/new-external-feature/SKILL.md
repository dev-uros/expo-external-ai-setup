---
name: new-external-feature
description: >
  Add a new feature (screen, list, detail, form) to this Expo app the way the template does it:
  feature folder, Zod-parsed API calls, TanStack Query hooks, route files, the four screen states,
  Jest tests and a Maestro flow that passes on iOS and Android. Use whenever the task is to build
  something new for the user — "add a screen for X", "show the list of Y", "let the user edit Z" —
  not for small fixes inside an existing feature.
---

# Adding a feature

`AGENTS.md` holds the rules; this is the order to apply them in. The `account` feature is the
reference for anything that **writes** — a form in a modal, a picker, a confirmation. This app has
no screen that **reads** a resource yet: for a list and a detail, mirror `src/features/users` in
the internal app's template (`dev-uros/expo-internal-ai-setup`, `internal-mobile-app/` in a
project that has it). Open the matching one and mirror it; do not invent a new shape.

## 0. Find out what the backend does

Read the Laravel side in the generated project before writing a line: the route
(`api/routes/api.php`, inside the `mobile/v1` group behind `EnsureMobileUser`), its controller and service, the Form Request (validation rules and
messages), the Resource (exact response fields) and the Policy (who may call it). The API's
behaviour decides the screen — e.g. a list that is not paginated searches on the
device. Messages the backend returns are shown as they arrive.

## 1. The feature folder

```
src/features/<feature>/
  api/<thing>.ts            calls through `request()` from `@/lib/http`, parsed with Zod
  schemas/                  Zod schemas + z.infer types; route-param parsers
  query/keys.ts             one root per feature; list/detail keys built on it
  query/use-<thing>-query.ts / use-<thing>-mutations.ts
  hooks/                    screen behaviour that tests drive with renderHook
  components/               rows, badges, pieces only this feature uses
  screens/                  what the route renders
  utils/                    pure helpers (filtering, formatting)
  testing/fixtures.ts       sample data the feature's tests share
```

- Something another feature already owns is **moved to `features/shared/`**, never imported
  across. A query-key root that two features touch lives in `features/shared/query/keys.ts`.
- A write invalidates its feature's root key, and any other root whose data it changed.

## 2. Routes

- Add the route files under `src/app/` — they read params and render the screen, nothing else.
  A dynamic param is parsed with the feature's Zod parser; an unusable one renders the screen's
  "not found" state without calling the API.
- A new tab: a `(group)/_layout.tsx` with a `Stack`, and a `NativeTabs.Trigger` in
  `(app)/(tabs)/_layout.tsx` with an SF Symbol and a Material icon. A modal: declared in
  `(app)/_layout.tsx`, not inside a tab.

## 3. The screen

- **Every string through `t()`**, in both `src/i18n/sr.json` and `en.json` (`docs/localization.md`);
  dates through `features/shared/utils/dates.ts`.
- **Four states** for anything loaded: loading (first fetch only), error with "Pokušaj ponovo",
  empty (in words — and a different sentence when a search matched nothing), content. A failed
  refresh keeps the stale content and says so above it. Use `ScreenMessage` for the first three.
- Lists: `FlashList` with `contentInsetAdjustmentBehavior="automatic"`, pull to refresh, rows that
  are one accessible element with a full `accessibilityLabel`. Search: `Stack.SearchBar`.
- Details: show the list's row at once (`placeholderData` from the list cache).
- Titles with `Stack.Title`, fonts only through `font()`, colors only through
  `usePalette()` in the component that draws them, both light and dark checked.

## 4. Tests — the feature is not done without them

- **Jest**, next to the files: API calls (path, method, body, parsing), utils, hooks, and each
  screen state (loading, error + retry, empty, content, refresh failure, 404). Mock the feature's
  `api/` module, render screens inside `renderRouter` with a fresh `QueryClient` (`retry: false`).
  `@expo/ui` button labels are native text Jest cannot read — give the button a `testID`.
- **Route tests** in `src/__tests__/` for deep links and guards.
- **Maestro**, `.maestro/<feature>/<flow>.yaml`: every user-facing path. Sign in with its own demo
  account (`maestro.<flow>@example.com` in the backend's `MOBILE_DEMO_EMAILS`, fixed code). A flow
  that writes puts the account back as it found it before it ends. Run it on **both** platforms; branch with
  `runFlow: when: platform:` only where the platforms truly differ, and say why.

## 5. Finish

`npm run format`, `npm run lint`, `npx tsc --noEmit`, `npm test`, then
`maestro --platform ios test .maestro` and `maestro --platform android test .maestro`. A new native
module or config plugin means `npx expo prebuild --clean` and a rebuild of both apps first.
Update `AGENTS.md` when the feature introduced a rule the next one should follow.
