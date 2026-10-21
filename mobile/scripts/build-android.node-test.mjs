import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, mock } from "node:test";
import { buildAndroid, reportFailure } from "./build-android.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(path.dirname(fileURLToPath(import.meta.url)), ".build test & (fixture)-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "android"), { recursive: true });
  for (const wrapper of ["gradlew", "gradlew.bat"]) {
    writeFileSync(path.join(root, "android", wrapper), "");
  }
  mkdirSync(path.join(root, "node_modules/expo/bin"), { recursive: true });
  writeFileSync(path.join(root, "node_modules/expo/bin/cli"), "// fake installed Expo entry point");
  return root;
}

function artifact(root, target = "apk", contents = "fake artifact") {
  const relative = target === "aab"
    ? "bundle/release/app-release.aab"
    : "apk/release/app-release.apk";
  const file = path.join(root, "android/app/build/outputs", relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
  return file;
}

test("rejects ambiguous or unknown arguments before spawning anything", () => {
  const invalid = [
    [], ["unknown"], ["apk", "aab"], ["apk", "--wat"], ["apk", "--arch"],
    ["apk", "--arch", "--no-prebuild"], ["apk", "--arch", "ARM64"],
    ["apk", "--arch", "arm64-v8a,"], ["apk", "--arch", "x86,x86"],
    ["apk", "--arch", "x86;echo"], ["apk", "--arch=x86", "--arch", "x86_64"],
    ["apk", "--no-prebuild", "--no-prebuild"],
  ];
  for (const argv of invalid) {
    assert.throws(() => buildAndroid(argv, {
      spawn: () => assert.fail("must validate before spawning"),
    }), (error) => error.exitCode === 2, JSON.stringify(argv));
  }
});

test("Windows prebuild invokes installed Expo using Node, and cmd only for the bat wrapper", (t) => {
  const root = fixture(t);
  const calls = [];
  buildAndroid(["--arch", "arm64-v8a,x86_64", "apk"], {
    projectRoot: root,
    platform: "win32",
    spawn(command, args, options) {
      calls.push({ command, args, options });
      if (calls.length === 2) artifact(root);
      return { status: 0 };
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].command, process.execPath);
  assert.equal(calls[0].args[0], path.join(root, "node_modules/expo/bin/cli"));
  assert.deepEqual(calls[0].args.slice(1), ["prebuild", "--platform", "android"]);
  assert.equal(calls[0].options.shell, false);
  assert.match(calls[1].command.toLowerCase(), /cmd(?:\.exe)?$/);
  assert.deepEqual(calls[1].args.slice(0, 3), ["/d", "/s", "/c"]);
  assert.equal(calls[1].args[3],
    `""${path.join(root, "android/gradlew.bat")}" assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64"`);
  assert.equal(calls[1].options.windowsVerbatimArguments, true);
  assert.equal(calls[1].options.shell, false);
});

test("POSIX uses its own wrapper and accepts --arch= syntax after the target", (t) => {
  const root = fixture(t);
  rmSync(path.join(root, "android/gradlew.bat"));
  buildAndroid(["install", "--no-prebuild", "--arch=armeabi-v7a,x86"], {
    projectRoot: root,
    platform: "linux",
    spawn(command, args, options) {
      assert.equal(command, path.join(root, "android/gradlew"));
      assert.deepEqual(args, ["installRelease", "-PreactNativeArchitectures=armeabi-v7a,x86"]);
      assert.equal(options.shell, false);
      return { status: 0 };
    },
  });
});

test("requires the wrapper for the selected platform", (t) => {
  const root = fixture(t);
  rmSync(path.join(root, "android/gradlew"));
  assert.throws(() => buildAndroid(["apk", "--no-prebuild"], {
    projectRoot: root, platform: "linux", spawn: () => assert.fail("missing wrapper"),
  }), /No Gradle wrapper/);
});

test("unavailable installed Expo entry point fails without invoking npx or Gradle", (t) => {
  // The parent has a resolvable Expo, so this also reproduces the inherited
  // dependency case without requiring real dependencies to be installed.
  const parent = fixture(t);
  const root = path.join(parent, "nested-project");
  mkdirSync(path.join(root, "node_modules/expo"), { recursive: true });
  // A local package boundary prevents resolution from falling through to a real
  // Expo installed in mobile/node_modules (or any other ancestor directory).
  writeFileSync(path.join(root, "node_modules/expo/package.json"),
    JSON.stringify({ name: "expo", exports: { "./bin/cli": "./missing-cli" } }));
  assert.throws(() => buildAndroid(["apk"], {
    projectRoot: root, spawn: () => assert.fail("must not spawn"),
  }), /Expo.*installed/i);
});

for (const phase of ["prebuild", "gradle"]) {
  for (const result of [
    { status: 17 },
    { status: null, signal: "SIGTERM" },
    { status: null, error: new Error("fake spawn failure") },
    { status: null },
  ]) {
    test(`${phase} failure stops the build: ${JSON.stringify(result)}`, (t) => {
      const root = fixture(t);
      let calls = 0;
      assert.throws(() => buildAndroid(
        phase === "gradle" ? ["apk", "--no-prebuild"] : ["apk"],
        { projectRoot: root, spawn() { calls++; return result; } },
      ), (error) => result.signal
        ? error.signal === result.signal
        : result.error ? /fake spawn failure/.test(error.message)
          : error.exitCode === (result.status ?? 1));
      assert.equal(calls, 1);
    });
  }
}

test("actual Windows CLI runs fake Expo and bat files in a path with spaces and shell punctuation", {
  skip: process.platform !== "win32",
}, (t) => {
  const root = fixture(t);
  const script = path.join(root, "scripts/build-android.mjs");
  mkdirSync(path.dirname(script), { recursive: true });
  writeFileSync(script, readFileSync(new URL("./build-android.mjs", import.meta.url)));
  const expo = path.join(root, "node_modules/expo/bin/cli");
  writeFileSync(expo, `
    const fs = require("node:fs");
    if (JSON.stringify(process.argv.slice(2)) !== JSON.stringify(["prebuild", "--platform", "android"])) process.exit(91);
    fs.writeFileSync("fake-prebuild-ran", "TEST_ONLY");
  `);
  writeFileSync(path.join(root, "android/gradlew.bat"), [
    "@echo off",
    'if not "%~1"=="assembleRelease" exit /b 92',
    // Like Gradle's real wrapper, inspect %*: cmd splits '=' in positional args.
    'if not "%*"=="assembleRelease -PreactNativeArchitectures=arm64-v8a" exit /b 93',
    "mkdir app\\build\\outputs\\apk\\release",
    "echo TEST_ONLY_FAKE_ARTIFACT>app\\build\\outputs\\apk\\release\\app-release.apk",
    "exit /b 0",
  ].join("\r\n"));
  const run = (args = ["apk", "--arch", "arm64-v8a"]) => spawnSync(
    process.execPath, [script, ...args], { encoding: "utf8", timeout: 10000 },
  );
  const success = run();
  assert.equal(success.status, 0, success.stderr);
  assert.equal(existsSync(path.join(root, "fake-prebuild-ran")), true);
  assert.equal(existsSync(path.join(root, "android/app/build/outputs/apk/release/app-release.apk")), true);

  writeFileSync(expo, "process.exit(23);");
  assert.equal(run().status, 23, "prebuild status reaches caller");
  writeFileSync(path.join(root, "android/gradlew.bat"), "@exit /b 27\r\n");
  assert.equal(run(["apk", "--no-prebuild"]).status, 27, "wrapper status reaches caller");
  assert.equal(run(["apk", "--unknown"]).status, 2, "invalid CLI args reach caller");
});

test("CLI failure handling preserves status and re-raises child signals", (t) => {
  const oldExitCode = process.exitCode;
  t.after(() => { process.exitCode = oldExitCode; });
  mock.method(console, "error", () => {}, { times: 2 });
  const kill = mock.method(process, "kill", () => true, { times: 1 });
  reportFailure(Object.assign(new Error("fake exit"), { exitCode: 17 }));
  assert.equal(process.exitCode, 17);
  reportFailure(Object.assign(new Error("fake signal"), { signal: "SIGTERM" }));
  assert.deepEqual(kill.mock.calls[0].arguments, [process.pid, "SIGTERM"]);
  assert.equal(process.exitCode, 143);
});

for (const target of ["apk", "aab"]) {
  test(`${target} deletes stale output and requires fresh nonempty regular output`, (t) => {
    const root = fixture(t);
    const file = artifact(root, target, "stale");
    for (const output of ["missing", "empty", "directory", "fresh"]) {
      rmSync(file, { recursive: true, force: true });
      artifact(root, target, "stale");
      const run = () => buildAndroid([target, "--no-prebuild"], {
        projectRoot: root,
        spawn() {
          assert.equal(existsSync(file), false, "stale output must be gone before Gradle");
          if (output === "directory") mkdirSync(file);
          if (output === "empty") artifact(root, target, "");
          if (output === "fresh") artifact(root, target);
          return { status: 0 };
        },
      });
      if (output === "fresh") assert.doesNotThrow(run);
      else assert.throws(run, /artifact/i);
    }
  });
}
