# Android APK Build and Troubleshooting Guide

This guide explains how to build a functional standalone APK for the Expo React Native Android app in `mobile/`.

The source of truth stays here:

```text
Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile
```

The release build should run from a short temporary Windows path:

```text
C:\wv-build
```

That short path matters because React Native native modules generate deep CMake/Ninja paths on Windows. Building directly from the long `Z:` project path can fail in native C++ tasks, especially `react-native-audio-api`.

## What Makes the APK Functional

Use a release APK built with Gradle:

```powershell
.\gradlew.bat assembleRelease
```

Do not use a debug Expo/dev-client APK as the final artifact. A debug/dev-client build can depend on Metro or open the Expo development client. The functional standalone APK must include the bundled JavaScript inside the Android package.

During a correct release build, Gradle should run:

```text
:app:createBundleReleaseJsAndAssets
```

The output APK is:

```text
C:\wv-build\android\app\build\outputs\apk\release\app-release.apk
```

The copied project artifact should be:

```text
Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk
```

## Clean Build Process

Run these commands in PowerShell.

### 1. Copy to a Short Build Folder

From anywhere:

```powershell
$source = "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile"
$target = "C:\wv-build"

Remove-Item $target -Recurse -Force -ErrorAction SilentlyContinue
robocopy $source $target /MIR /XD android node_modules .expo dist
```

Important: exclude `android` and `node_modules`. This prevents stale generated native state and stale dependency paths from being copied into the short-path build.

### 2. Set Build Environment

```powershell
$jdk = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$sdk = "C:\Users\Blasto\AppData\Local\Android\Sdk"

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:NODE_ENV = "production"
$env:RNV_AUDIO_API_BASH = "C:\Program Files\Git\bin\bash.exe"
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"
```

`RNV_AUDIO_API_BASH` forces `react-native-audio-api` to use Git Bash instead of Windows' WSL bash launcher.

### 3. Install Dependencies and Apply Patches

```powershell
cd C:\wv-build
npm install
npx patch-package
```

`npm install` should run the `postinstall` script, but running `npx patch-package` again is harmless and confirms the `react-native-audio-api` patch is applied.

Check the patch was applied:

```powershell
Select-String -Path C:\wv-build\node_modules\react-native-audio-api\android\build.gradle -Pattern "RNV_AUDIO_API_BASH|Git/bin/bash"
```

You should see the patched Gradle task using Git Bash.

### 4. Generate Android Native Project

```powershell
cd C:\wv-build
npx expo prebuild --platform android --no-install
```

### 5. Add Android SDK Path

```powershell
Set-Content `
  -LiteralPath C:\wv-build\android\local.properties `
  -Value "sdk.dir=C:/Users/Blasto/AppData/Local/Android/Sdk" `
  -Encoding ascii
```

`local.properties` is machine-local and must exist in the temporary build folder.

### 6. Build Release APK

```powershell
cd C:\wv-build\android
.\gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,x86_64" --console=plain
```

Use:

```text
arm64-v8a
```

for real modern Android phones, and:

```text
x86_64
```

for emulators.

### 7. Copy APK Back to the Repo

```powershell
$source = "C:\wv-build\android\app\build\outputs\apk\release\app-release.apk"
$destDir = "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist"
$dest = Join-Path $destDir "waveform-viz-standalone-release.apk"

New-Item -ItemType Directory -Path $destDir -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $dest -Force
```

### 8. Verify APK Signature

```powershell
$apk = "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk"
$apksigner = "C:\Users\Blasto\AppData\Local\Android\Sdk\build-tools\36.0.0\apksigner.bat"

& $apksigner verify --verbose $apk
```

Expected result:

```text
Verifies
Verified using v2 scheme (APK Signature Scheme v2): true
Number of signers: 1
```

## Install the APK

Connect an Android phone with USB debugging enabled, then run:

```powershell
adb devices
adb uninstall com.waveformviz.intervaltemperament
adb install "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk"
```

The uninstall step removes any earlier debug/dev-client build with the same package name.

## Troubleshooting

### `downloadPrebuiltBinaries FAILED` with WSL `/bin/bash`

Error:

```text
> Task :react-native-audio-api:downloadPrebuiltBinaries FAILED
WSL ... execvpe(/bin/bash) failed: No such file or directory
```

Cause: Gradle ran plain `bash`, Windows resolved it to:

```text
C:\Windows\System32\bash.exe
```

That is the WSL bash launcher. If WSL has no working Linux shell, the task fails.

Fix:

```powershell
cd C:\wv-build
npx patch-package
$env:RNV_AUDIO_API_BASH = "C:\Program Files\Git\bin\bash.exe"
```

Then retry:

```powershell
cd C:\wv-build\android
.\gradlew.bat :react-native-audio-api:downloadPrebuiltBinaries --console=plain
```

If that succeeds, rerun `assembleRelease`.

### Patch Did Not Apply

Check the generated dependency file:

```powershell
Select-String -Path C:\wv-build\node_modules\react-native-audio-api\android\build.gradle -Pattern "commandLine|RNV_AUDIO_API_BASH|bash"
```

Good patched version:

```text
def gitBashPath = 'C:/Program Files/Git/bin/bash.exe'
def bashExecutable = System.getenv('RNV_AUDIO_API_BASH') ?: ...
commandLine bashExecutable, '../scripts/download-prebuilt-binaries.sh'
```

Bad unpatched version:

```text
commandLine 'chmod', '+x', '../scripts/download-prebuilt-binaries.sh'
commandLine 'bash', '../scripts/download-prebuilt-binaries.sh'
```

If it is unpatched:

```powershell
cd C:\wv-build
npx patch-package
```

### Native CMake/Ninja Path Error

Error example:

```text
ninja: error: mkdir(src/main/cpp/audioapi/CMakeFiles/react-native-audio-api.dir/Z_/Codezzz/...)
```

Cause: the native build is still referencing the long `Z:` source path.

Fix:

1. Delete `C:\wv-build`.
2. Recopy from `mobile` while excluding `android` and `node_modules`.
3. Run `npm install`.
4. Run `npx patch-package`.
5. Run `npx expo prebuild --platform android --no-install`.
6. Rebuild.

Do not copy an existing `android` directory into `C:\wv-build`; it can contain stale absolute paths.

### `SDK location not found`

Error:

```text
SDK location not found. Define a valid SDK location with ANDROID_HOME or local.properties.
```

Fix:

```powershell
Set-Content `
  -LiteralPath C:\wv-build\android\local.properties `
  -Value "sdk.dir=C:/Users/Blasto/AppData/Local/Android/Sdk" `
  -Encoding ascii
```

Also set:

```powershell
$env:ANDROID_HOME = "C:\Users\Blasto\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Blasto\AppData\Local\Android\Sdk"
```

### `JAVA_HOME` or Wrong Java Version

Use JDK 17:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

Expected major version:

```text
17
```

### Build Hangs or Leaves Java Processes Running

Stop Gradle daemons:

```powershell
cd C:\wv-build\android
.\gradlew.bat --stop
```

If you also tried building from the repo path:

```powershell
cd Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\android
.\gradlew.bat --stop
```

### APK Installs but Opens the Wrong App Type

If the APK opens an Expo development client or expects Metro, you installed a debug/dev-client APK.

Use this file instead:

```text
C:\wv-build\android\app\build\outputs\apk\release\app-release.apk
```

or the copied artifact:

```text
mobile\dist\waveform-viz-standalone-release.apk
```

### Orientation Switch Does Not Work

Check the generated manifest:

```powershell
Select-String -Path C:\wv-build\android\app\src\main\AndroidManifest.xml -Pattern "screenOrientation|configChanges"
```

The activity should not be locked to portrait. `unspecified` is acceptable:

```text
android:screenOrientation="unspecified"
```

If it says `portrait`, check `app.json` and regenerate Android:

```json
"orientation": "default"
```

Then:

```powershell
Remove-Item C:\wv-build\android -Recurse -Force
npx expo prebuild --platform android --no-install
```

## Quick Rebuild Checklist

```powershell
Remove-Item C:\wv-build -Recurse -Force -ErrorAction SilentlyContinue
robocopy "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile" "C:\wv-build" /MIR /XD android node_modules .expo dist

$jdk = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$sdk = "C:\Users\Blasto\AppData\Local\Android\Sdk"
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:NODE_ENV = "production"
$env:RNV_AUDIO_API_BASH = "C:\Program Files\Git\bin\bash.exe"
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"

cd C:\wv-build
npm install
npx patch-package
npx expo prebuild --platform android --no-install
Set-Content -LiteralPath C:\wv-build\android\local.properties -Value "sdk.dir=C:/Users/Blasto/AppData/Local/Android/Sdk" -Encoding ascii

cd C:\wv-build\android
.\gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,x86_64" --console=plain

New-Item -ItemType Directory -Force "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist" | Out-Null
Copy-Item "C:\wv-build\android\app\build\outputs\apk\release\app-release.apk" "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk" -Force
```
