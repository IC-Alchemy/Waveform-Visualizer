// Builds a standalone Android artifact from the generated native project.
//
//   node scripts/build-android.mjs aab       -> android/app/build/outputs/bundle/release/app-release.aab
//   node scripts/build-android.mjs apk       -> android/app/build/outputs/apk/release/app-release.apk
//   node scripts/build-android.mjs install   -> gradlew installRelease onto the connected device
//
// Runs `expo prebuild --platform android` first, because android/ is generated
// and gitignored. Pass --no-prebuild to reuse an existing android/ directory.
// Pass --arch arm64-v8a to cut native build time while iterating.
//
// Google Play requires the AAB. The APK is for local installs only.

import { spawnSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { constants } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TASKS = { aab: "bundleRelease", apk: "assembleRelease", install: "installRelease" };
const ARTIFACTS = {
  aab: "app/build/outputs/bundle/release/app-release.aab",
  apk: "app/build/outputs/apk/release/app-release.apk",
};
const ABIS = new Set(["armeabi-v7a", "arm64-v8a", "x86", "x86_64"]);
const USAGE = "Usage: node scripts/build-android.mjs <aab|apk|install> [--no-prebuild] [--arch <abis>]";

function parseArgs(argv) {
  let target;
  let arch;
  let prebuild = true;
  const invalid = (message) => {
    throw Object.assign(new Error(`${message}\n${USAGE}`), { exitCode: 2 });
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-prebuild" && prebuild) {
      prebuild = false;
    } else if ((arg === "--arch" || arg.startsWith("--arch=")) && arch === undefined) {
      arch = arg === "--arch" ? argv[++i] : arg.slice("--arch=".length);
      const abis = arch?.split(",") ?? [];
      if (!abis.length || abis.some((abi) => !ABIS.has(abi)) || new Set(abis).size !== abis.length) {
        invalid(`--arch requires a comma-separated list of distinct ABIs: ${[...ABIS].join(", ")}`);
      }
    } else if (Object.hasOwn(TASKS, arg) && target === undefined) {
      target = arg;
    } else {
      invalid(`Unexpected argument: ${arg}`);
    }
  }
  if (!target) invalid("A build target is required.");
  return { target, arch, prebuild };
}

export function buildAndroid(argv, {
  projectRoot = defaultRoot,
  platform = process.platform,
  spawn = spawnSync,
} = {}) {
  const { target, arch, prebuild } = parseArgs(argv);
  const androidDir = path.join(projectRoot, "android");
  function run(command, args, options = {}) {
    const result = spawn(command, args, {
      cwd: androidDir, stdio: "inherit", shell: false, ...options,
    });
    if (result.error) throw result.error;
    if (result.signal || result.status !== 0) {
      throw Object.assign(new Error(`${path.basename(command)} ${result.signal
        ? `terminated by ${result.signal}` : `failed (exit ${result.status ?? "unknown"})`}`), {
        exitCode: result.status ?? 1,
        signal: result.signal,
      });
    }
  }

  if (prebuild) {
    let expoCli;
    try {
      expoCli = createRequire(path.join(projectRoot, "package.json")).resolve("expo/bin/cli");
    } catch {
      throw new Error("Expo must be installed locally. Run npm ci in mobile/ before prebuilding.");
    }
    // Node entry point, not npx(.cmd): no shell, network fallback, or Windows shim.
    run(process.execPath, [expoCli, "prebuild", "--platform", "android"], { cwd: projectRoot });
  }

  const gradlew = path.join(androidDir, platform === "win32" ? "gradlew.bat" : "gradlew");
  if (!existsSync(gradlew)) {
    throw new Error("No Gradle wrapper in android/. Run without --no-prebuild, or install the Android SDK and retry.");
  }
  const gradleArgs = [TASKS[target]];
  if (arch) gradleArgs.push(`-PreactNativeArchitectures=${arch}`);
  const artifact = ARTIFACTS[target] && path.join(androidDir, ARTIFACTS[target]);
  // A successful no-op or fake Gradle process must not make stale output look fresh.
  if (artifact) rmSync(artifact, { force: true });

  if (platform === "win32") {
    // Batch files need cmd.exe. Quote the wrapper (including spaces); all remaining
    // arguments come from TASKS and the ABI whitelist, never unchecked shell text.
    run(process.env.ComSpec || "cmd.exe",
      ["/d", "/s", "/c", `""${gradlew}" ${gradleArgs.join(" ")}"`],
      { windowsVerbatimArguments: true });
  } else {
    run(gradlew, gradleArgs);
  }

  if (artifact) {
    const stat = existsSync(artifact) && statSync(artifact);
    if (!stat || !stat.isFile() || stat.size === 0) {
      throw new Error(`Expected fresh, nonempty artifact is missing or invalid: ${artifact}`);
    }
    console.log(`\nBuilt ${artifact} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
    if (target === "apk") {
      console.log("This is for local installs. Google Play requires the AAB from `npm run build:aab`.");
    }
  }
}

export function reportFailure(error) {
  console.error(error.message);
  process.exitCode = error.exitCode ?? 1;
  if (error.signal) {
    process.exitCode = 128 + (constants.signals[error.signal] ?? 1);
    try {
      process.kill(process.pid, error.signal);
    } catch {
      // Some platforms cannot re-raise every signal; retain a nonzero exit code.
    }
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    buildAndroid(process.argv.slice(2));
  } catch (error) {
    reportFailure(error);
  }
}
