# Virtual Analog XY Oscilloscope — Android

Native Expo React Native port of the root `index.html` WebGL2 oscilloscope.

The browser app remains the behavioral reference. This Android app rebuilds the
two-oscillator XY visualizer with native controls, a Skia canvas, and PNG
sharing. Version 1.0 has no audio, accounts, ads, or application network calls.
Release manifests block unused network, storage, overlay, and vibration
permissions. Debug variants retain internet access for the local Metro server.

## Local Validation

```powershell
cd mobile
npm ci
npm run typecheck
npm test
```

`npm test` runs the five music-model tests plus the local build/config-plugin
tests. `npm run test:release` runs just the latter. These host-side checks do not
replace Android builds or device testing.

## Release Signing

The release build is wired by `plugins/withAndroidRelease.js`, which maintains a
marked block in the generated `android/app/build.gradle`. Repeated prebuilds
replace that block rather than accumulating it. `android/` is disposable and
gitignored, so the plugin is the source of truth.

**EAS is the chosen future store-build path.** It has not been connected or used
to upload this project. When authorized, EAS will manage its own upload
credentials. `.easignore` excludes local signing files; `EAS_BUILD=true`
prevents the plugin from applying local signing settings.

For local release builds, without `mobile/keystore.properties` a release build
falls back to the **debug keystore** and is not uploadable to Play. To sign a
local release build:

Use an existing key outside the repository, backed up securely. Copy
`keystore.properties.example` to `mobile/keystore.properties` and fill in
`storeFile`, `storePassword`, `keyAlias`, and `keyPassword` locally. It uses UTF-8
Java Properties syntax; follow the example's escaping instructions. Gradle
reads it at configuration time, not prebuild time: incomplete settings or a
missing key file fail the build. Passwords are never inserted into generated
Gradle source.

`keystore.properties` and every `*.jks` / `*.keystore` file are gitignored.

## Building Locally

```powershell
npm run build:apk             # local install       -> app/build/outputs/apk/release/app-release.apk
npm run install:release       # gradlew installRelease onto the connected device
```

Every command runs `expo prebuild --platform android` first and then Gradle, so
configuration plugins are reapplied. Prebuild is incremental unless explicitly
run with `--clean`; `--no-prebuild` deliberately reuses the current native
project. Build failures propagate, and the helper requires fresh, nonempty
output rather than accepting an old artifact.

Useful flags, for cutting native build time while iterating:

```powershell
node scripts/build-android.mjs apk --arch arm64-v8a
node scripts/build-android.mjs apk --no-prebuild
```

## Building for Google Play

`npm run build:aab` also exists and produces a local AAB, but the store artifact
will eventually come from EAS. **Cloud builds and Play uploads are not
authorized yet.** Nothing runs automatically. When separately authorized:

```powershell
eas login                      # once, needs an Expo account
eas build --profile production --platform android   # -> app-release.aab
```

`eas.json` defines two profiles: `preview` (internal-distribution APK) and
`production` (AAB, with local `autoIncrement` managing `android.versionCode` in
`app.json`; inspect any config changes after invoking EAS). There is no development-client
profile: that would pull in `expo-dev-client`, which this app does not ship.

Publishing requires separate authorization and Play credentials. Do not run a
submission command during local development.

## Windows Native Build Paths

The long Delta worktree path and even the standard temporary directory exceeded
Windows/Ninja path limits during native builds. A fresh short staging directory
worked: `C:\wv-xy-ccgxgds15v80`.

Do not mirror over an existing directory with `robocopy /MIR`. Copy the current
`mobile/` sources to a new short directory, excluding `node_modules`, `android`,
`ios`, `.expo`, `dist`, and all credentials. Then run `npm ci`, set `JAVA_HOME`
to JDK 17 and `ANDROID_HOME` to the Android SDK, and build:

```powershell
$env:CI = "1"
$env:NODE_ENV = "production"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_OPTS = "-Dorg.gradle.workers.max=4"
npm run build:aab -- --arch arm64-v8a
```

This is an arm64-only local validation build. With no local signing properties,
it uses the standard debug key even though its Gradle variant is `release`.
It is not a Play release. Omit `--arch` to build the default ABI set later.

## Before Uploading

```powershell
$aab = "android\app\build\outputs\bundle\release\app-release.aab"
java -jar bundletool-all.jar validate --bundle=$aab
keytool -printcert -jarfile $aab         # verify the certificate, not a local key alias
bundletool dump manifest --bundle=$aab  # versionCode / package must match app.json
```

`android.versionCode` in `app.json` must be a strictly increasing integer on
every upload. The application ID is permanent once published.

## Package

```text
com.icalchemy.xyoscilloscope
```

The application ID is permanent once the app is published on Google Play, so
this value is set deliberately rather than derived from the app name.

See `../PLAY_STORE_READINESS_PLAN.md` for the full Play Store readiness plan.

## Device Checks Still Required

- Header, scope and picker sheets stay clear of cutouts and navigation bars in
  portrait and landscape, with both gesture and three-button navigation.
- Outside tap and Back close a picker; selecting an item does not close the
  wrong control.
- TalkBack reads the oscillator axis, slider value, picker selection, and named
  phosphor colors. Controls remain usable with large system fonts.
- Freeze/resume and PNG sharing work on a physical device.

No installation or device session is implied by a successful local build.

The dated [local validation record](LOCAL_VALIDATION.md) lists actual build
results, artifact hashes, checks performed, and checks still missing.
