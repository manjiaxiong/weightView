# Weight Management Android App Design

Date: 2026-05-12

## Goal

Build an offline-first Android weight management app using frontend technology that the user can read and maintain. The app should be installable as an APK without deploying a web service. Future Android releases must be able to replace the installed package while preserving local data.

## Target Platform

- Primary target: Android.
- iOS is out of scope for the first version.
- Distribution: release APK shared directly to the phone.
- Upgrade path: install a newer APK over the existing app.

## Technical Approach

Use React, Vite, TypeScript, and Capacitor.

This keeps the application code close to standard frontend development while allowing Android APK packaging. The app has no backend, no login, and no network dependency.

Recommended dependencies:

- `react`, `vite`, `typescript`
- `@capacitor/core`, `@capacitor/android`
- `localforage` for local persistence
- `recharts` for the weight trend chart
- `date-fns` for date handling
- `lucide-react` for icons

## Android Upgrade Requirements

Future APKs must keep the same Android application id and signing key.

- Application id: `com.weightview.app`
- Release signing must use a stable keystore kept outside generated build output.
- Version code must increase for each release APK.
- If the app is upgraded without uninstalling, Android should preserve app-private data.
- If the app is uninstalled, local private data can be removed by Android, so JSON export/import is required as a backup path.

Changing the application id or losing the signing key would prevent normal upgrade installation over the previous app.

## Product Scope

The first version includes:

- Weight record creation, editing, and deletion.
- Injection record creation, editing, and deletion.
- Weight trend chart.
- Calendar view showing weight and injection markers.
- Record list for reviewing history.
- JSON export and import.
- Local schema versioning and migration support.
- Android APK build configuration.

The first version excludes:

- Login.
- Cloud sync.
- Network APIs.
- Injection reminders or notifications.
- Medical guidance or dosage recommendations.
- iOS packaging.
- Multi-user support.

## Data Model

The app stores two primary record types.

```ts
type WeightRecord = {
  id: string
  date: string // YYYY-MM-DD
  weight: number
  createdAt: string
  updatedAt: string
}

type InjectionRecord = {
  id: string
  date: string // YYYY-MM-DD
  medicineName: string // default: "Tirzepatide"
  dose?: string // optional, for example "2.5mg"
  createdAt: string
  updatedAt: string
}

type AppData = {
  schemaVersion: 1
  records: {
    weights: WeightRecord[]
    injections: InjectionRecord[]
  }
  settings: {
    unit: "kg"
    defaultMedicineName: "Tirzepatide"
  }
}
```

Weight records are unique by date in version 1. If the user records weight twice on the same day, the later save updates that date's record.

Injection records are also unique by date in version 1. This matches the initial requirement to record injection dates without reminder scheduling.

## Storage And Migration

All persistence goes through service modules. UI components must not directly read or write browser storage.

Storage responsibilities:

- `storageService` reads and writes the complete app data.
- `migrationService` checks `schemaVersion` on startup and applies future migrations.
- `backupService` validates import files and creates export files.

The first version can store data using `localforage`. The service boundary keeps the UI stable if storage later moves to SQLite or another Capacitor-backed store.

## Backup Behavior

Export creates a JSON file containing:

- schema version
- export timestamp
- weight records
- injection records
- settings

Import behavior:

- Validate that the JSON has a supported schema.
- Merge imported records into existing local data.
- If the same date exists in both local and imported weight records, imported weight data wins.
- If the same date exists in both local and imported injection records, imported injection data wins.
- Show a confirmation before import explaining that same-date conflicts will be overwritten by the imported file.

## Navigation And Screens

Use a mobile-first layout with bottom navigation.

### Home

Home shows the current status and quick actions:

- Latest weight.
- Change from the previous weight record.
- Weight trend chart with range selector: 7 days, 30 days, all.
- Latest injection date and days since that date.
- Quick buttons for recording weight and injection.

### Calendar

Calendar shows one month at a time.

- Days with weight records show the weight value.
- Days with injection records show an injection or medicine marker.
- A day can show both kinds of marker.
- Tapping a day opens the relevant record actions:
  - If no record exists, allow creating weight or injection for that date.
  - If records exist, allow viewing/editing/deleting them.

### Records

Records shows history in reverse chronological order.

- Weight records display date, weight, and change from the previous weight record.
- Injection records display date, medicine name, and optional dose.
- Records can be edited or deleted.

### Settings

Settings contains:

- Export JSON.
- Import JSON.
- Current schema version.
- App version information.
- Short local-data note explaining that uninstalling the app can remove private app data unless exported.

## Components

Suggested component boundaries:

- `BottomNav`: bottom tab navigation.
- `TrendChart`: renders weight trend data.
- `MonthCalendar`: renders month grid and day markers.
- `WeightEntrySheet`: add/edit weight record.
- `InjectionEntrySheet`: add/edit injection record.
- `RecordList`: combined chronological record list.
- `ImportExportPanel`: backup controls.

These components should receive typed data and callbacks from page-level containers. They should not directly access storage.

## Project Structure

```text
weightView/
  src/
    app/
      App.tsx
      routes.tsx
    pages/
      HomePage.tsx
      CalendarPage.tsx
      RecordsPage.tsx
      SettingsPage.tsx
    components/
      WeightEntrySheet.tsx
      InjectionEntrySheet.tsx
      TrendChart.tsx
      MonthCalendar.tsx
      BottomNav.tsx
    services/
      storageService.ts
      backupService.ts
      migrationService.ts
    domain/
      types.ts
      weight.ts
      injection.ts
      date.ts
    styles/
      global.css
  android/
  capacitor.config.ts
  package.json
```

## Error Handling

- Invalid weight input blocks save and shows an inline error.
- Empty injection date blocks save.
- Dose is optional and stored as user-entered text.
- Import failures show a clear error and do not modify existing data.
- Migration failures should keep the original stored data untouched and show a recoverable error.

## Testing Strategy

Focus tests on domain and persistence behavior:

- Weight record create/update/delete.
- Same-date weight overwrite.
- Injection record create/update/delete.
- Same-date injection overwrite.
- Trend chart data preparation.
- Calendar marker data preparation.
- Backup export shape.
- Backup import validation and merge behavior.
- Migration service behavior for schema version 1.

Manual verification should include:

- App runs in browser during development.
- Android APK builds.
- APK installs on an Android device.
- Upgrading with a newer APK preserves data.
- Exported JSON can be imported into a clean install.
