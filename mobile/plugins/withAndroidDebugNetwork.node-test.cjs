const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { AndroidConfig } = require("expo/config-plugins");

const sandbox = {
  module: { exports: {} },
  require(id) {
    return id === "expo/config-plugins"
      ? { AndroidConfig, withDangerousMod: (_config, [, callback]) => callback }
      : require(id);
  },
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "withAndroidDebugNetwork.js"), "utf8"), sandbox);
const apply = sandbox.module.exports({});

test("Metro access is debug-only and repeated application does not duplicate permissions", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xy-debug-manifest-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:usesCleartextTraffic="true"/></manifest>';
  for (const variant of ["main", "release", "debug", "debugOptimized"]) {
    const dir = path.join(root, "app", "src", variant);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "AndroidManifest.xml"), source);
  }
  const mod = { modRequest: { platformProjectRoot: root } };
  await apply(mod);
  await apply(mod);
  for (const variant of ["main", "release", "debug", "debugOptimized"]) {
    const file = path.join(root, "app", "src", variant, "AndroidManifest.xml");
    const text = fs.readFileSync(file, "utf8");
    if (variant === "main" || variant === "release") {
      assert.equal(text, source, `${variant} must not change`);
    } else {
      const xml = await AndroidConfig.Manifest.readAndroidManifestAsync(file);
      assert.equal(xml.manifest["uses-permission"].length, 1);
      assert.equal(xml.manifest["uses-permission"][0].$["android:name"], "android.permission.INTERNET");
      assert.equal(xml.manifest.application[0].$["android:usesCleartextTraffic"], "true");
    }
  }
});

test("absent optional debug manifests are not created", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xy-debug-manifest-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  await apply({ modRequest: { platformProjectRoot: root } });
  assert.deepEqual(fs.readdirSync(root), []);
});
