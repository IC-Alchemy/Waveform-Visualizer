# Web App to Android App Conversion Reference
This is an explanation of the changing of a similar but different webapp into a react native app.  
This project converted the original browser app in `index.html` into a working Android app by rebuilding the same product as a native Expo React Native app under `mobile/`. The final Android app is a native React Native application that uses the original web app as a behavioral reference.

The final installable APK is built as a standalone release APK with the JavaScript bundle embedded inside the Android package. That is the important distinction: a debug Expo dev-client APK is useful for development, but it opens the Expo development launcher and expects a Metro server. The standalone release APK opens directly into this app.

## Project Shape

The root project keeps the original browser implementation:

```text
index.html
README.md
USER_MANUAL.md
DEVELOPER_MANUAL.md
```

The Android app lives separately:

```text
mobile/
  App.tsx
  index.ts
  app.json
  package.json
  src/
    components/
    hooks/
    model/
  patches/
  dist/
```

This separation matters. The browser app remains a stable reference implementation, while `mobile/` is the native Android product. The conversion did not try to mechanically wrap or transpile the single HTML file. Instead, the functionality was reimplemented against native React Native surfaces.

## What Was Ported

The original web app had several major responsibilities:

- music and tuning math
- note selection UI
- equal temperament vs just intonation comparison
- animated Lissajous-style visualizer
- optional audio output
- PNG export

The Android version keeps those same product responsibilities, but each browser technology was replaced with an Android-compatible native equivalent.

| Browser app responsibility | Browser implementation | Android implementation |
| --- | --- | --- |
| App shell | single `index.html` | Expo React Native app |
| UI | HTML/CSS/DOM events | React Native components |
| music math | JavaScript in the page | pure TypeScript model |
| visualizer | WebGL/canvas-style rendering | React Native Skia |
| animation | browser frame loop | native-timed React Native hook |
| audio | Web Audio | `react-native-audio-api` |
| export | browser PNG download | Skia snapshot plus Android share sheet |

## Core Architecture

The most important conversion decision was to extract the app behavior into native-friendly layers rather than porting the web file line by line.

### Pure Music Model

The music and comparison logic lives in:

```text
mobile/src/model/comparison.ts
```

That file is the native app's source of truth for:

- note names in the `C3-B4` range
- MIDI and note conversion
- equal temperament frequency calculation
- just-intonation interval ratio lookup
- upward and downward interval handling
- semitone distance
- interval labels
- equal Y frequency
- just Y frequency
- Hz delta
- cents delta

This is why the Android app can match the browser app's behavior without depending on browser APIs. The domain logic is plain TypeScript, so it is easy to test and reuse.

The tests live in:

```text
mobile/src/model/comparison.test.ts
mobile/src/model/ui.test.ts
```

### React Native UI

The native UI is built from React Native components rather than HTML controls.

Main files:

```text
mobile/App.tsx
mobile/src/components/NoteSelector.tsx
mobile/src/components/ReadoutPanel.tsx
mobile/src/components/SegmentedControl.tsx
```

The UI keeps the same functional controls:

- X root note selector
- Y target note selector
- Equal / Just / Both visual mode selector
- comparison readouts
- audio enable/disable
- audio temperament selector when needed
- volume slider
- PNG export/share action

The Android layout is phone portrait first. That matters because the original browser interface had more room and could lean on desktop-style layout patterns. The native version puts the visualizer first and keeps controls compact enough for touch use.

### Native Visualizer

The visualizer lives in:

```text
mobile/src/components/Visualizer.tsx
mobile/src/hooks/useAnimationTime.ts
```

The browser visualizer was not reused directly. React Native cannot render WebGL or DOM canvas code the same way a browser does. The Android app rebuilds the visualizer with React Native Skia.

React Native Skia provides a native drawing surface. The app uses it to draw:

- CRT-style grid lines
- animated Lissajous traces
- equal temperament trace
- just intonation trace
- stacked Equal and Just panes in Both mode

The animation time is kept outside normal React state where possible so the app does not force full React re-renders every frame. React owns the selected notes and mode; the visualizer uses those values to generate native drawing output.

### Native Audio

The Android audio path lives in:

```text
mobile/src/hooks/useAudioEngine.ts
```

The browser app used Web Audio. Android React Native does not have Web Audio, so the native app uses:

```text
react-native-audio-api
```

The audio design stays equivalent:

- audio starts only after user action
- X oscillator follows the selected root note
- Y oscillator follows equal or just frequency depending on the selected mode
- volume is controlled by a native slider
- gentle shaping is used for a sine-like, slightly softened sound

This gives the app real native audio behavior without requiring a browser runtime.

### PNG Export and Sharing

The Android export path uses the Skia-rendered visualizer rather than browser download APIs.

The final flow is:

1. Capture a Skia canvas snapshot.
2. Encode it as PNG.
3. Write it to app cache with Expo FileSystem.
4. Open the Android share sheet with Expo Sharing.

This avoids gallery/media permissions in the first version. The app shares a generated PNG without needing broad storage access.

## Native Dependencies

The final app depends on native modules, so Expo Go is not the target runtime.

Important dependencies in `mobile/package.json`:

```json
{
  "@shopify/react-native-skia": "2.2.12",
  "react-native-audio-api": "^0.12.1",
  "react-native-reanimated": "~4.1.1",
  "react-native-worklets": "^0.8.3",
  "expo-file-system": "~19.0.22",
  "expo-sharing": "~14.0.8"
}
```

The final installable APK intentionally does not include:

```text
expo-dev-client
```

`expo-dev-client` is useful for development builds, but it creates an APK that launches the Expo development client. For a normal APK that opens directly into the app, leave `expo-dev-client` out of the production package and build a release APK with the JS bundle embedded.

## Patch Package

The project uses `patch-package`:

```text
mobile/patches/
```

and this script:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

That makes local dependency patches durable after `npm install`. For this project, the patch is part of the working Windows Android build setup for the native audio package.

## Required Local Toolchain

The working Windows build uses:

- JDK 17
- Android SDK
- Android NDK installed through the Android SDK
- Android build tools
- Git Bash available on the machine
- npm dependencies installed in `mobile/`

The JDK used successfully:

```text
C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
```

The Android SDK used successfully:

```text
C:\Users\Blasto\AppData\Local\Android\Sdk
```

## Why the Build Uses `C:\wv-build`

The working build method uses a short real Windows path:

```text
C:\wv-build
```

React Native Android builds compile native C++ code for Skia, Reanimated, Worklets, and the audio API. On Windows, those native build systems can generate very long intermediate paths. Building from a short path keeps the generated CMake and Ninja paths short enough for the native build.

The short-path build directory is a build workspace, not the source of truth. The source project remains:

```text
Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile
```

## Repeatable Standalone APK Build

Run these commands from PowerShell.

### 1. Copy the Mobile App to a Short Build Path

From the repository root:

```powershell
robocopy `
  "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile" `
  "C:\wv-build" `
  /MIR `
  /XD .expo android\build android\app\build node_modules\.cache `
  /NFL /NDL /NJH /NJS /NP
```

### 2. Set Build Environment Variables

```powershell
$jdk = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$sdk = "C:\Users\Blasto\AppData\Local\Android\Sdk"

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:NODE_ENV = "production"
$env:Path = "$jdk\bin;$sdk\platform-tools;$env:Path"
```

### 3. Install Dependencies

```powershell
cd C:\wv-build
npm install
```

The `postinstall` script applies the dependency patches from `patches/`.

### 4. Generate the Native Android Project

```powershell
if (Test-Path android) {
  Remove-Item android -Recurse -Force
}

if (Test-Path .expo) {
  Remove-Item .expo -Recurse -Force
}

npx expo prebuild --platform android --no-install
```

This creates a fresh native Android project from the Expo config and installed native modules.

### 5. Add the Local Android SDK Path

```powershell
Set-Content `
  -LiteralPath C:\wv-build\android\local.properties `
  -Value "sdk.dir=C:\\Users\\Blasto\\AppData\\Local\\Android\\Sdk" `
  -Encoding ascii
```

`local.properties` is machine-local generated configuration. It should not be treated as portable source code.

### 6. Keep the APK ABI Set Practical

For a first local APK, build only 64-bit Android ABIs:

```powershell
$gradleProps = "C:\wv-build\android\gradle.properties"
$text = Get-Content -LiteralPath $gradleProps -Raw
$text = $text -replace "reactNativeArchitectures=.*", "reactNativeArchitectures=arm64-v8a,x86_64"
$text = $text -replace "org\.gradle\.jvmargs=.*", "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m"
Set-Content -LiteralPath $gradleProps -Value $text -Encoding ascii
```

`arm64-v8a` covers normal modern Android phones. `x86_64` is useful for emulators.

### 7. Build the Standalone Release APK

```powershell
cd C:\wv-build\android
.\gradlew assembleRelease "-PreactNativeArchitectures=arm64-v8a,x86_64"
```

The important signal in the build output is:

```text
createBundleReleaseJsAndAssets
```

That task bundles `index.ts` and writes the app's JavaScript into the Android release package. This is what makes the APK standalone.

The generated APK is:

```text
C:\wv-build\android\app\build\outputs\apk\release\app-release.apk
```

### 8. Copy the APK Back to the Project

```powershell
$source = "C:\wv-build\android\app\build\outputs\apk\release\app-release.apk"
$destDir = "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist"
$dest = Join-Path $destDir "waveform-viz-standalone-release.apk"

New-Item -ItemType Directory -Path $destDir -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $dest -Force
```

The final APK path is:

```text
Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk
```

### 9. Verify the APK Signature

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

## Install on Android

Enable USB debugging on the Android device, connect it by USB, then check:

```powershell
adb devices
```

Install the standalone APK:

```powershell
adb uninstall com.waveformviz.intervaltemperament
adb install "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile\dist\waveform-viz-standalone-release.apk"
```

The uninstall step removes any earlier debug/dev-client APK with the same package name. After installing the standalone release APK, launching the app should open the Waveform Visualizer app directly.

## Validation Commands

Before building the APK, validate the TypeScript and model behavior:

```powershell
cd "Z:\Codezzz\DesktopDevs\WaveformVisualizerAndroid\WaveformVizAndroid\mobile"
npm run typecheck
npm test
```

The final verified state was:

```text
npm run typecheck: passed
npm test: 2 test files passed, 9 tests passed
assembleRelease: BUILD SUCCESSFUL
apksigner verify: Verifies
```

## Why This Worked

This conversion worked because the app was split by responsibility instead of wrapped as a web page.

The original `index.html` provided the product specification: what notes exist, how intervals are calculated, how equal and just temperament differ, what the visualizer should communicate, how audio should behave, and what export means.

The React Native app rebuilt those responsibilities with Android-capable technologies:

- TypeScript for deterministic music math
- React Native for touch UI
- Skia for native drawing
- React Native Audio API for native oscillator audio
- Expo FileSystem and Sharing for Android-compatible PNG export
- Gradle `assembleRelease` for a standalone installable APK

The final APK works as an Android app because it contains both the native Android shell and the bundled React Native JavaScript. It does not depend on a browser, a hosted website, Expo Go, or a running development server.

## Key Rule for Future Builds

For a user-installable APK, build:

```powershell
.\gradlew assembleRelease
```

and install:

```text
app-release.apk
```

Do not use a debug Expo dev-client APK as the final artifact. A dev-client APK is for development workflows; the release APK is the standalone app.
