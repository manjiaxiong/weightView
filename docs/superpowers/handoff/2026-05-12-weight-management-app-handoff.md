# Weight Management App Handoff

Date: 2026-05-13
Workspace: `D:\code\weightView`
Current branch: `master`
Current HEAD before this handoff edit: `008ee89 feat: add home dashboard`

## Purpose

This document lets another agent continue the weight management Android app without needing the full prior conversation.

The app is an offline Android-first weight and injection tracker built with React, Vite, TypeScript, and later Capacitor. The user wants an APK that can be sent to an Android phone and installed directly. The app must keep data across APK upgrades as long as package id and signing key stay stable. Data backup/import is required.

## Source Documents

- Design spec: `docs/superpowers/specs/2026-05-12-weight-management-app-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-12-weight-management-app.md`

These docs are tracked in git. This handoff update may be uncommitted until the next checkpoint.

## User Requirements

- Android first. iOS can wait.
- No backend, no login, no network feature.
- Install by sending an APK to the phone.
- Future versions should upgrade over the existing app and preserve data.
- Data must also support JSON export/import for backup, reinstall, or changing phones.
- Track simple weight records: date + weight.
- Track injection records for Tirzepatide: date + medicine name + optional dose.
- No injection reminders in v1.
- Show both trend chart and calendar view.

## 2026-05-13 Review Checkpoint

The user said another model finished the later code and asked for a review. Current working tree contains uncommitted Task 8-10 style implementation work plus this handoff edit.

Implemented by the other model before this review:

- Task 8 Calendar:
  - Added `src/components/MonthCalendar.tsx`.
  - Replaced `src/pages/CalendarPage.tsx` with month navigation, date selection, and add/edit weight/injection sheet entry for the selected date.
  - Added calendar CSS in `src/styles/global.css`.
- Task 9 Records and Settings:
  - Replaced `src/pages/RecordsPage.tsx` with a combined reverse chronological weight/injection list and delete buttons.
  - Replaced `src/pages/SettingsPage.tsx` with JSON import/export UI.
  - Added records/settings CSS.
- Task 10 Android packaging:
  - Added `capacitor.config.ts`.
  - Added generated `android/` project.
  - Added `docs/android-release.md`.
  - Added Capacitor scripts in `package.json`.

Review fixes made in this session:

- Added Android-native backup export support in `src/pages/SettingsPage.tsx` using `@capacitor/filesystem` and `@capacitor/share`, because browser `Blob` download is not reliable inside a Capacitor Android WebView.
- Added `@capacitor/filesystem@^7.0.0` and `@capacitor/share@^7.0.0` to dependencies.
- Added `src/pages/SettingsPage.test.tsx` covering:
  - Android-native export writes a JSON backup into `Directory.Cache`.
  - Android-native export invokes the share sheet with the generated file URI.
  - Valid backup import calls `replaceData`.
  - Invalid backup JSON alerts and does not replace local data.
- Fixed import file reading in `src/pages/SettingsPage.tsx` by adding `readFileText(file)`: use `file.text()` when available, otherwise fall back to `FileReader.readAsText`. This fixed a real compatibility issue exposed by jsdom and may also help older Android WebViews.
- Fixed the new Settings test typing so `tsc -b` can compile the test file.
- Removed `<uses-permission android:name="android.permission.INTERNET" />` from `android/app/src/main/AndroidManifest.xml` to match the offline/no-network requirement.

Verification run in this session:

```powershell
npm.cmd test -- src/pages/SettingsPage.test.tsx
npm.cmd test
npm.cmd run build
npm.cmd run cap:sync
npx.cmd cap doctor android
cd android
.\gradlew.bat assembleDebug
java -version
```

Observed results:

- `npm.cmd test -- src/pages/SettingsPage.test.tsx` passed: 3 tests.
- `npm.cmd test` passed: 13 files, 58 tests.
- `npm.cmd run build` passed.
- `npm.cmd run cap:sync` passed and found two Android plugins:
  - `@capacitor/filesystem@7.0.0`
  - `@capacitor/share@7.0.0`
- `npx.cmd cap doctor android` exited successfully and reported Android looking good, but installed versions are mixed:
  - `@capacitor/android: 7.6.4`
  - `@capacitor/core: 7.6.4`
  - `@capacitor/cli: 8.3.4`
- `.\gradlew.bat assembleDebug` is blocked by local Java version, not by TypeScript/Vite:
  - Current Java is OpenJDK 1.8.0_432.
  - Android Gradle Plugin `com.android.tools.build:gradle:8.13.0` requires Java 11+.
  - `com.google.gms:google-services:4.4.4` also requires Java 11+.
- Build also still emits the known Vite warning that the main JS chunk is larger than 500 kB, likely from Recharts. This is a performance warning, not a build failure.

Interrupted/incomplete work:

- I attempted to align `@capacitor/cli` to the Capacitor 7 major version with `npm.cmd install -D @capacitor/cli@^7.0.0`.
- The sandboxed attempt failed with npm `EACCES` while fetching from the registry.
- The escalated retry was interrupted by the user before it completed.
- As of this handoff, `package.json` still contains `@capacitor/cli: ^8.3.4`; do not assume the CLI was downgraded.

Files that should not be committed:

- `.claude/settings.json` is local agent config and should remain untracked.

## Execution Mode

The user chose subagent-driven execution.

Continue with:

- `subagent-driven-development`
- Per task: implementer subagent -> spec compliance review -> code quality review -> fix loop
- Do not proceed to the next task while review has Critical or Important issues.
- Do not run multiple implementation workers in parallel against overlapping files.

## Completed Tasks

### Task 1: Initialize Project

Status: complete and reviewed.

Commits:

- `95ae1d4 chore: initialize weight view app`
- `b9e3c8b fix: stabilize bootstrap test setup`

Notes:

- Project initialized as git repo.
- React/Vite/TypeScript bootstrap added.
- `npm.cmd test` originally failed with no tests; fixed with `src/app/App.test.tsx`.
- `@vitejs/plugin-react` moved to `devDependencies`.
- Build and test passed after fix.

### Task 2: Domain Types And Date Utilities

Status: complete and reviewed.

Commits:

- `37fd25c feat: add date domain utilities`
- `411e464 fix: validate calendar dates`

Notes:

- Added `src/domain/types.ts`, `src/domain/date.ts`, `src/domain/date.test.ts`.
- `normalizeIsoDate` now validates both `YYYY-MM-DD` shape and actual calendar validity.
- Invalid dates like `2026-02-31`, `2026-13-01`, and `2026-00-10` are rejected.
- Date tests pass.

### Task 3: Weight And Injection Domain Logic

Status: complete and reviewed.

Commit:

- `d9ad0ba feat: add record domain logic`

Notes:

- Added weight and injection domain modules plus tests.
- Same-date upsert updates existing record and preserves id.
- Records sort by date descending.
- Weight rejects non-positive and non-finite values.
- Injection defaults medicine name to `Tirzepatide`, trims fields, and normalizes blank dose to `undefined`.
- Reviewer noted only minor test coverage gaps; no blocker.

### Task 4: Migration And Backup Services

Status: complete and reviewed.

Commits:

- `362f4fd feat: add migration and backup services`
- `eba66ab fix: validate backup data`
- `bbeb6f6 fix: validate backup envelope`
- `1688563 fix: require iso backup timestamp`

Notes:

- Added migration and backup services plus tests.
- `createEmptyAppData` returns schema version 1, empty records, kg unit, and default medicine name.
- `migrateAppData` is forgiving for app startup but filters invalid stored records unless strict mode is used.
- `importBackupJson` uses strict record validation so malformed backups cannot overwrite valid local records.
- Backup envelope validation now requires:
  - parsed JSON is an object
  - `exportedAt` is exactly the `new Date().toISOString()` style shape
  - `data.schemaVersion` is a number
  - `data.records.weights` and `data.records.injections` are arrays
  - `data.settings` is an object
- Known rejected imports include `{}`, `{ "data": null }`, `{ "exportedAt": validIso, "data": {} }`, invalid record fields, and non-ISO `exportedAt` values.
- Service tests pass with 16 tests.

### Task 5: Storage Service And App State

Status: complete and reviewed.

Commits:

- `65bd2a6 feat: add local app state`
- `70b0e36 fix: handle save errors without unmounting`

Notes:

- Added localforage persistence boundary.
- Added `useAppData` as the page-facing app data boundary.
- Added bottom tab navigation and temporary page stubs.
- Split startup load errors from save errors.
- Save failures keep pages and bottom nav mounted and surface a non-fatal `saveError`.
- Added tests for tab navigation, load failure, save failure, action persistence, and queued rapid writes.
- `npm.cmd test` passed with 39 tests after Task 5.
- `npm.cmd run build` passed.

### Task 6: Entry Sheets And Forms

Status: complete and reviewed.

Commits:

- `b984ab5 feat: add entry sheets`
- `c6f6698 fix: harden entry sheet interactions`

Notes:

- Added shared `EntrySheet`.
- Added `WeightEntrySheet`.
- Added `InjectionEntrySheet`.
- Added sheet/form CSS.
- Task 6 spec compliance review passed after accounting for the later docs-only commit.
- Code quality review found focus management and pending-save close issues.
- `c6f6698` fixed focus entry/trap/restore behavior, Escape handling, close-disabled behavior during pending saves, and added component tests.
- `npm.cmd test` passed with 50 tests after Task 6 hardening.
- `npm.cmd run build` passed.

### Task 7: Home Page And Trend Chart

Status: complete and reviewed.

Commit:

- `008ee89 feat: add home dashboard`

Notes:

- Added `TrendChart` using Recharts.
- Added Home dashboard with latest weight, weight delta, quick entry buttons, trend chart, latest injection date, and days since latest injection.
- Home opens `WeightEntrySheet` and `InjectionEntrySheet`.
- Added Home and TrendChart tests.
- Task 7 spec compliance review passed.
- Task 7 code quality review passed with no Critical or Important findings.
- `npm.cmd test` passed with 55 tests.
- `npm.cmd run build` passed.
- Non-blocker: Vite warns that the main JS chunk is about 653.89 kB minified, likely due to Recharts. Reviewer marked this as Minor and not blocking Task 8.

## Current Verification

Fresh verification from the 2026-05-13 review session:

```powershell
npm.cmd test -- src/pages/SettingsPage.test.tsx
npm.cmd test
npm.cmd run build
npm.cmd run cap:sync
npx.cmd cap doctor android
```

All commands above passed. `npm.cmd test` passed with 58 tests.

Android debug APK build was attempted with:

```powershell
cd android
.\gradlew.bat assembleDebug
```

It failed because the machine is running Java 8. Install or switch to JDK 17, then rerun the Android build.

## Current Git State

Observed `git status -sb` during the 2026-05-13 review:

```text
## master...origin/master [ahead 2]
 M docs/superpowers/handoff/2026-05-12-weight-management-app-handoff.md
 M package-lock.json
 M package.json
 M src/app/App.test.tsx
 M src/pages/CalendarPage.tsx
 M src/pages/RecordsPage.tsx
 M src/pages/SettingsPage.tsx
 M src/styles/global.css
?? .claude/
?? android/
?? capacitor.config.ts
?? docs/android-release.md
?? src/components/MonthCalendar.tsx
?? src/pages/SettingsPage.test.tsx
```

The two unpushed commits are:

- `c6f6698 fix: harden entry sheet interactions`
- `008ee89 feat: add home dashboard`

The modified/untracked files include later Task 8-10 work and the review fixes described above. They are not committed yet.

There is also a recurring warning:

```text
warning: unable to access 'C:\Users\19579/.config/git/ignore': Permission denied
```

This warning has not blocked commits or builds.

## Full Execution Plan

This section contains the whole build plan, including completed and remaining tasks. A new agent should continue with Task 8, but should understand the full destination before changing code.

## Next Session Start Here

Start by reviewing and committing the uncommitted Task 8-10 work plus the review fixes.

Do not redo Task 6 or Task 7. They are complete and reviewed. Do not redo the Settings native export/import fix unless tests fail.

Recommended first commands:

```powershell
git status -sb
npm.cmd test
npm.cmd run build
npm.cmd run cap:sync
```

Then resolve the Android build environment:

```powershell
java -version
```

If Java is still 1.8, install or select JDK 17 before:

```powershell
cd android
.\gradlew.bat assembleDebug
```

After the APK build is unblocked, run the remaining review:

1. Spec compliance review for Task 8 Calendar, Task 9 Records/Settings, and Task 10 Android packaging.
2. Code quality review for the same scope.
3. Fix Critical and Important findings.
4. Commit only intended files; do not commit `.claude/settings.json`.
5. Push when the user asks.

### Task 1: Initialize Project

Status: complete.

Files created:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `vitest.setup.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/styles/global.css`

Required verification:

```powershell
npm.cmd test
npm.cmd run build
```

Commits:

- `95ae1d4 chore: initialize weight view app`
- `b9e3c8b fix: stabilize bootstrap test setup`

### Task 2: Domain Types And Date Utilities

Status: complete.

Files created:

- `src/domain/types.ts`
- `src/domain/date.ts`
- `src/domain/date.test.ts`

Required behavior:

- Define `CURRENT_SCHEMA_VERSION`, `DEFAULT_MEDICINE_NAME`, `IsoDate`, `IsoDateTime`, `WeightRecord`, `InjectionRecord`, `AppSettings`, `AppData`, and `CalendarDay`.
- Implement `normalizeIsoDate`, `getTodayIsoDate`, `compareIsoDateDesc`, `compareIsoDateAsc`, `daysBetween`, and `getCalendarMonth`.
- Reject malformed dates and calendar-invalid dates.
- Generate a 42-day month grid with leading and trailing days.

Required verification:

```powershell
npm.cmd test -- src/domain/date.test.ts
npm.cmd run build
```

Commits:

- `37fd25c feat: add date domain utilities`
- `411e464 fix: validate calendar dates`

### Task 3: Weight And Injection Domain Logic

Status: complete.

Files created:

- `src/domain/weight.ts`
- `src/domain/weight.test.ts`
- `src/domain/injection.ts`
- `src/domain/injection.test.ts`

Required behavior:

- Weight functions: `sortWeightRecords`, `upsertWeightRecord`, `deleteWeightRecord`, `getLatestWeight`, `getWeightDelta`.
- Injection functions: `sortInjectionRecords`, `upsertInjectionRecord`, `deleteInjectionRecord`, `getLatestInjection`.
- Same-date upsert updates existing record and keeps id.
- New records sort by date descending.
- Weight rejects non-positive and non-finite values.
- Injection defaults medicine name to `Tirzepatide`, trims medicine and dose, and stores blank dose as `undefined`.

Required verification:

```powershell
npm.cmd test -- src/domain/weight.test.ts src/domain/injection.test.ts
npm.cmd run build
```

Commit:

- `d9ad0ba feat: add record domain logic`

### Task 4: Migration And Backup Services

Status: complete.

Files created:

- `src/services/migrationService.ts`
- `src/services/migrationService.test.ts`
- `src/services/backupService.ts`
- `src/services/backupService.test.ts`

Required behavior:

- `createEmptyAppData` returns schema version 1 data with empty weights/injections, `kg`, and `Tirzepatide`.
- `migrateAppData` accepts schema 1 data, repairs missing app-startup data, filters invalid stored records in non-strict mode, and rejects future schema versions.
- `buildExportPayload`, `buildExportJson`, and `importBackupJson` exist.
- `importBackupJson` rejects invalid JSON with `Backup file is not valid JSON`.
- `importBackupJson` rejects invalid backup envelope with `Backup file is not a valid Weight View backup`.
- `importBackupJson` rejects invalid record data with `Backup contains invalid record data`.
- Imported same-date records overwrite local records only after strict validation.
- `exportedAt` must match the exact ISO timestamp style produced by `new Date().toISOString()`.

Required verification:

```powershell
npm.cmd test -- src/services/migrationService.test.ts src/services/backupService.test.ts
npm.cmd run build
```

Commits:

- `362f4fd feat: add migration and backup services`
- `eba66ab fix: validate backup data`
- `bbeb6f6 fix: validate backup envelope`
- `1688563 fix: require iso backup timestamp`

### Task 5: Storage Service And App State

Status: complete and reviewed.

Files to create or modify:

- `src/services/storageService.ts`
- `src/app/useAppData.ts`
- `src/app/App.tsx`
- `src/components/BottomNav.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/pages/RecordsPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/styles/global.css`

Required behavior:

- Add localforage persistence boundary.
- Load stored data through `migrateAppData`.
- Save all app data through `saveAppData`.
- Add `useAppData` hook with actions:
  - `saveWeight`
  - `removeWeight`
  - `saveInjection`
  - `removeInjection`
  - `replaceData`
- Replace temporary `App` shell with page routing by bottom tab state.
- Create temporary page stubs so later tasks can replace them.
- Add bottom navigation with tabs: `home`, `calendar`, `records`, `settings`.
- Add loading and error states in `App`.

Required verification:

```powershell
npm.cmd run build
```

Expected commit:

```powershell
git add src
git commit -m "feat: add local app state"
```

Actual commits:

- `65bd2a6 feat: add local app state`
- `70b0e36 fix: handle save errors without unmounting`

## Important Implementation Notes For Task 5

- Use `npm.cmd`, not `npm`, in PowerShell. Plain `npm` hit execution policy problems earlier.
- Do not weaken the backup validation added in Task 4.
- Do not let UI components access localforage directly.
- `useAppData` should be the page-facing state boundary.
- Be careful with stale closures in `useAppData`; actions that depend on `data` should update consistently after saves.
- Leave untracked `docs/` alone unless the user asks to commit docs.

### Task 6: Entry Sheets And Forms

Status: complete and reviewed.

Files to create or modify:

- `src/components/EntrySheet.tsx`
- `src/components/WeightEntrySheet.tsx`
- `src/components/InjectionEntrySheet.tsx`
- `src/styles/global.css`

Required behavior:

- Add a shared bottom sheet modal component.
- Add weight add/edit form with date and positive kg input.
- Add injection add/edit form with date, medicine name, and optional dose.
- Weight save blocks invalid/non-positive weight and shows an inline error.
- Injection defaults medicine name to `Tirzepatide`.
- Forms call passed `onSave` callbacks and close after successful save.
- Add mobile-friendly sheet styling.
- Later hardening added focus entry/trap/restore and disabled close while save is pending.

Required verification:

```powershell
npm.cmd run build
npm.cmd test
```

Expected commit:

```powershell
git add src/components src/styles/global.css
git commit -m "feat: add entry sheets"
```

Actual commits:

- `b984ab5 feat: add entry sheets`
- `c6f6698 fix: harden entry sheet interactions`

### Task 7: Home Page And Trend Chart

Status: complete and reviewed.

Files to create or modify:

- `src/components/TrendChart.tsx`
- `src/pages/HomePage.tsx`
- `src/styles/global.css`

Required behavior:

- Add a Recharts line chart for weight trends.
- Chart supports `7d`, `30d`, and `All` ranges.
- Home page shows:
  - latest weight
  - change from previous weight
  - quick buttons for weight and injection entry
  - trend chart
  - latest injection date
  - days since latest injection
- Home page opens `WeightEntrySheet` and `InjectionEntrySheet`.
- Empty chart state should render cleanly when there are no weight records.

Required verification:

```powershell
npm.cmd run build
npm.cmd test
```

Expected commit:

```powershell
git add src/components/TrendChart.tsx src/pages/HomePage.tsx src/styles/global.css
git commit -m "feat: add home dashboard"
```

Actual commit:

- `008ee89 feat: add home dashboard`

Review notes:

- Spec compliance passed.
- Code quality passed with only Minor findings.
- Non-blocker: Recharts currently contributes to a large initial JS chunk warning.

### Task 8: Calendar Page

Status: implemented in working tree, not committed, still needs formal review.

Files to create or modify:

- `src/components/MonthCalendar.tsx`
- `src/pages/CalendarPage.tsx`
- `src/styles/global.css`

Required behavior:

- Render a month calendar with 7 columns and 42 days.
- Show weight value on days with weight records.
- Show an injection marker on days with injection records.
- A day can show both markers.
- Support previous/next month navigation.
- Tapping a date selects it and shows actions:
  - add/edit weight for that date
  - add/edit injection for that date
- Reuse entry sheets with `initialDate` and existing record when present.

Required verification:

```powershell
npm.cmd run build
```

Expected commit:

```powershell
git add src/components/MonthCalendar.tsx src/pages/CalendarPage.tsx src/styles/global.css
git commit -m "feat: add calendar tracking view"
```

### Task 9: Records And Settings Pages

Status: implemented in working tree, not committed, partially fixed during review, still needs formal review.

Files to create or modify:

- `src/pages/RecordsPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/styles/global.css`

Required behavior:

- Records page combines weight and injection records into a reverse chronological list.
- Weight rows show date, weight, and `Weight`.
- Injection rows show date, medicine name, and optional dose.
- Delete buttons remove the selected record through `useAppData` actions.
- Settings page exports JSON with `buildExportJson`.
- Settings page imports selected `.json` files with `importBackupJson`.
- Import must show a confirmation that same-date imported records overwrite local records.
- Import success and failure should be visible to the user.
- Settings page shows schema version and local-data warning.
- Review fix added Android-native export through Capacitor Filesystem/Share.
- Review fix added `FileReader` fallback for import compatibility.

Required verification:

```powershell
npm.cmd run build
npm.cmd test
```

Expected commit:

```powershell
git add src/pages src/styles/global.css
git commit -m "feat: add records and backup settings"
```

### Task 10: Capacitor Android Packaging

Status: implemented in working tree, not committed, Android APK build blocked by local Java 8.

Files to create or modify:

- `capacitor.config.ts`
- `android/`
- `docs/android-release.md`
- `package.json`
- `package-lock.json`

Required behavior:

- Add Capacitor config with:
  - `appId: 'com.weightview.app'`
  - `appName: 'Weight View'`
  - `webDir: 'dist'`
- Add `@capacitor/cli` as a dev dependency.
- Current `@capacitor/cli` is `^8.3.4` while `@capacitor/core` and `@capacitor/android` resolve to `7.6.4`. `cap doctor` passed, but aligning CLI to Capacitor 7 should still be considered for consistency.
- Generate Android project with `npx cap add android`.
- Sync web build into Android with `npm run cap:sync` or `npm.cmd run cap:sync`.
- Document debug APK and release APK process.
- Document that app id and signing key must not change between releases.
- Document upgrade test:
  - install version A
  - add records
  - export JSON
  - build version B with same app id and signing key
  - install over version A without uninstalling
  - confirm records remain
  - import JSON into a clean install and confirm records return

Required verification:

```powershell
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew assembleDebug
```

Current verification status:

- `npm.cmd run cap:sync` passes.
- `.\gradlew.bat assembleDebug` fails until Java 11+ is available; prefer JDK 17.
- `android/app/src/main/AndroidManifest.xml` has had the generated `INTERNET` permission removed to preserve the offline requirement.

Expected APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Expected commit:

```powershell
git add capacitor.config.ts package.json package-lock.json android docs/android-release.md
git commit -m "feat: add android packaging"
```

### Task 11: Final Verification

Status: pending.

Files to modify:

- Only modify files if verification finds a concrete defect.

Required automated verification:

```powershell
npm.cmd test
npm.cmd run build
```

Required browser smoke test:

```powershell
npm.cmd run dev
```

Manual browser checks:

- Home opens without console errors.
- Add one weight record.
- Add one injection record.
- Calendar shows both markers on selected dates.
- Records page shows both records.
- Export JSON downloads a file.
- Import JSON into the same app completes.

Required Android build verification:

```powershell
npm.cmd run cap:sync
cd android
.\gradlew assembleDebug
```

Expected APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

If verification requires fixes:

```powershell
git add src docs package.json package-lock.json capacitor.config.ts android
git commit -m "fix: complete app verification"
```

If no files changed, do not create an empty commit.

## Product Completion Criteria

The app is complete for v1 when all of these are true:

- `npm.cmd test` passes.
- `npm.cmd run build` passes.
- Android debug APK builds.
- App can add, edit, and delete weight records.
- App can add, edit, and delete injection records.
- Home page shows latest weight, weight delta, trend chart, latest injection date, and days since injection.
- Calendar page shows both weight and injection markers.
- Records page shows combined history and supports deletion.
- Settings page exports and imports JSON.
- Bad backup files are rejected and do not alter local data.
- `docs/android-release.md` explains app id, signing key, release APK, and upgrade testing.

## Review Standards

For each remaining task:

1. Confirm the task commit exists.
2. Run the task-specific tests or `npm.cmd run build`.
3. Dispatch a spec compliance review.
4. Dispatch a code quality review.
5. Fix all Critical and Important feedback before continuing.

## Open Non-Blockers

- npm reports one critical vulnerability during install. No package-level fix has been applied yet because it has not blocked local functionality.
- Domain tests could later be expanded for timestamp preservation and additional invalid input coverage.
- Release signing is not configured yet; it belongs to Task 10.
- Vite warns that the main JS chunk is larger than 500 kB, likely due to Recharts. Consider lazy-loading the chart later.
- Capacitor CLI is currently on major version 8 while core/android are on 7. `cap doctor` passed, but version alignment should be revisited.
- Android debug APK cannot be produced on this machine until Java is upgraded from 8 to 11+; JDK 17 is the pragmatic target.
