# Local validation record

Date: **2026-10-21 UTC**. This records a local build, not a store release.

## What was built

- Name: Virtual Analog XY Oscilloscope.
- Application ID: `com.icalchemy.xyoscilloscope`.
- Version: `1.0.0`, version code `1`.
- Android: minimum API 24, target/compile API 36.
- Architecture checked: **arm64-v8a only**.
- Source: the current uncommitted mobile worktree, copied to a fresh short
  directory, `C:\wv-xy-ccgxgds15v80`. The existing `C:\wv-build` was not changed.
- Command: `npm run build:aab -- --arch arm64-v8a`, after `npm ci`, with
  `CI=1`, `NODE_ENV=production`, JDK 17 and the local Android SDK configured.
- Result: Gradle `bundleRelease` exited 0. The JavaScript bundle is embedded.

## Retained artifacts

These are gitignored, machine-local outputs under `mobile/dist/`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `xyoscilloscope-local-arm64.aab` | 64,879,391 | `c906235614fb9ff4f7d6ba02b8cdecbf53e0bcc86c38310cea6e3eba73f9f4bf` |
| `xyoscilloscope-local-arm64.apk` | 34,793,210 | `edcca30e5b7e917dd6e00e55f78b78c04188f04e2e8df5454718c1a736f3612a` |

Both use the standard **Android Debug** certificate. No production upload key
was created. The APK was generated locally from the AAB with Bundletool 1.18.3;
it is intended for local arm64 device testing, not Play submission.

## Checks actually run

- `npm run typecheck`: passed.
- `npm test`: five Vitest model tests and 25 Node build/config-plugin tests
  passed. No additional test dependency was added.
- `CI=1 npx expo install --check`: passed. Worklets remains an explicit
  compatibility exception; see the readiness plan.
- `CI=1 npx --yes expo-doctor@latest`: 18/18 passed.
- `git diff --check`: passed.
- Bundletool 1.18.3 `validate`: exited 0 for the final AAB.
- Bundletool `dump manifest`: confirmed package/version/API and that no internet,
  external-storage, overlay or vibration permission remains in the release.
  The only `uses-permission` is AndroidX's app-internal
  `com.icalchemy.xyoscilloscope.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`.
- AAB contents: embedded JS, arm64 libraries and native debug-symbol metadata
  inspected.
- `:app:processDebugMainManifest`: passed; the merged debug manifest retains
  internet permission for local Metro.
- SDK 36 `apksigner verify --verbose --print-certs`: APK verified using v2/v3,
  with the expected Android Debug certificate.
- SDK 36 `zipalign -c -P 16 4`: passed for the APK.
- Static ELF inspection: all 18 arm64 `.so` files have `PT_LOAD` alignment of at
  least 16 KB and congruent file/virtual-address offsets modulo 16 KB. This is
  a static compatibility check, not a run on a 16 KB-page device.

The official Bundletool download was checked against the GitHub release's
SHA-256: `a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29`.

## Not done

No install or launch, emulator or physical-device session, TalkBack test,
rotation/cutout/navigation-bar visual check, PNG share test, or performance
measurement. Other ABIs and real production signing remain unverified.

No Expo login, project registration, EAS cloud build, Play Console interaction,
upload, commit, Git staging or push occurred. Building an artifact does not authorize
any of those actions.
