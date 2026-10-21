const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

// Exercise the real plugin callback without installing Expo or running prebuild/Gradle.
const sandbox = {
  module: { exports: {} },
  require(id) {
    if (id === "expo/config-plugins") return { withAppBuildGradle: (_config, callback) => callback };
    return require(id);
  },
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "withAndroidRelease.js"), "utf8"), sandbox);
const apply = sandbox.module.exports({});
const base = "android {\n    buildTypes { release { signingConfig signingConfigs.debug } }\n}\n";
const begin = "// @generated begin withAndroidRelease";
const end = "// @generated end withAndroidRelease";

function transform(root, contents = base, language = "groovy") {
  return apply({
    modRequest: { projectRoot: root },
    modResults: { contents, language },
  }).modResults.contents;
}

test("repeated prebuild is stable with absent, valid, and incomplete local properties", (t) => {
  const root = fs.mkdtempSync(path.join(__dirname, ".signing-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const properties = path.join(root, "keystore.properties");
  const unsigned = transform(root);
  for (const value of [
    "storeFile=fake.jks\nstorePassword=TEST_ONLY_'$\\\\{}\nkeyAlias=TEST_ONLY_ALIAS\nkeyPassword=TEST_ONLY_PASSWORD\n",
    "storeFile=fake.jks\n",
  ]) {
    fs.writeFileSync(properties, value);
    const generated = transform(root, unsigned);
    assert.equal(generated, unsigned, "prebuild defers all local properties handling to Gradle");
    assert.equal(transform(root, generated), generated);
    assert.doesNotMatch(generated, /TEST_ONLY|fake\.jks/);
  }
  fs.unlinkSync(properties);
  assert.equal(transform(root, unsigned), unsigned);
  assert.equal(unsigned.split(begin).length, 2);
  assert.equal(unsigned.split(end).length, 2);
});

test("migrates legacy inline credentials, including Groovy special characters, without losing other code", () => {
  const legacy = "// Added by plugins/withAndroidRelease.js\nandroid {\n" +
    "    signingConfigs {\n        release {\n" +
    "            storeFile file('C:/fake/path.jks')\n" +
    "            storePassword 'TEST_ONLY_\\'\\\\${notCode}{}'\n" +
    "            keyAlias 'TEST_ONLY_ALIAS'\n            keyPassword 'TEST_ONLY_PASSWORD'\n" +
    "        }\n    }\n}\n";
  const suffix = "\n// Another plugin owns this.\notherPlugin { enabled true }\n";
  for (const newline of ["\n", "\r\n"]) {
    const result = transform("/unused", (base + "\n" + legacy + suffix).replace(/\n/g, newline));
    assert.doesNotMatch(result, /TEST_ONLY|fake\/path|Added by plugins/);
    assert.ok(result.includes(suffix.replace(/\n/g, newline).trim()));
    assert.equal(transform("/unused", result), result);
  }
});

test("replaces an existing owned block rather than skipping or accumulating it", () => {
  const prior = `${base}\n${begin}\n// TEST_ONLY obsolete content\n${end}\n`;
  const generated = transform("/unused", prior);
  assert.doesNotMatch(generated, /obsolete/);
  assert.equal(generated, transform("/unused"));
});

test("fails closed for malformed owned blocks or unsupported Gradle language", () => {
  assert.throws(() => transform("/unused", `${base}\n${begin}\npartial`), /generated block/i);
  assert.throws(() => transform("/unused", `${base}\n// Added by plugins/withAndroidRelease.js\npartial`),
    /generated block/i);
  assert.throws(() => transform("/unused", base, "kotlin"), /Groovy/);
});

test("generated Gradle defers secrets to Java Properties and guards ALL local signing from EAS", () => {
  const generated = transform("/unused");
  assert.match(generated, /System\.getenv\("EAS_BUILD"\) != "true"/);
  const guard = generated.indexOf('System.getenv("EAS_BUILD")');
  for (const code of [
    'rootProject.file("../keystore.properties")',
    'withReader("UTF-8")',
    "waveformKeystore.load(it)",
    '["storeFile", "storePassword", "keyAlias", "keyPassword"]',
    "throw new GradleException",
    "waveformStoreFile.isAbsolute()",
    "waveformKeystoreFile.parentFile",
    "waveformStoreFile.isFile()",
    'storePassword waveformKeystore.getProperty("storePassword")',
    'keyAlias waveformKeystore.getProperty("keyAlias")',
    'keyPassword waveformKeystore.getProperty("keyPassword")',
    "signingConfig signingConfigs.waveformLocalRelease",
    "logger.warn",
  ]) {
    assert.ok(generated.indexOf(code) > guard, `${code} must be inside the EAS guard`);
  }
  assert.match(generated, /getProperty\(it\)\?\.trim\(\)/);
  assert.match(generated, /debugSymbolLevel "FULL"/);
  assert.ok(generated.startsWith(base.trimEnd()));
});

test("EAS ignore explicitly excludes local properties and keys while retaining gitignore rules", () => {
  const mobile = path.dirname(__dirname);
  const ignore = fs.readFileSync(path.join(mobile, ".easignore"), "utf8").split(/\r?\n/);
  for (const rule of ["**/keystore.properties", "**/*.jks", "**/*.keystore", "**/*.p12", "**/*.pfx", "**/*.pem", "**/*.key"]) {
    assert.ok(ignore.includes(rule), rule);
  }
  for (const rule of fs.readFileSync(path.join(mobile, ".gitignore"), "utf8").split(/\r?\n/)) {
    if (rule && !rule.startsWith("#")) assert.ok(ignore.includes(rule), `retain ${rule}`);
  }
});
