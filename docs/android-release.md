# Android Release Notes

The Android application id is `com.weightview.app`. Do not change it between releases.

Use the same release keystore for every version. If the signing key changes, Android cannot install a new APK over the old app.

## Development Build

```powershell
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

Debug APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Release Build

Create and keep a release keystore outside generated build folders.

```powershell
keytool -genkeypair -v -keystore weight-view-release.jks -alias weight-view -keyalg RSA -keysize 2048 -validity 10000
```

Configure Android signing with a local `release-key.properties` file that is not committed.

Each release must increase Android `versionCode`.

Build:

```powershell
cd android
.\gradlew assembleRelease
```

Release APK output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Upgrade Test

1. Install version A.
2. Add weight and injection records.
3. Export a JSON backup.
4. Build version B with the same app id and signing key.
5. Install version B over version A without uninstalling.
6. Confirm records are still present.
7. On a clean install, import the JSON backup and confirm records return.
