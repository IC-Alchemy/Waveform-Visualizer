const fs = require("node:fs");
const path = require("node:path");
const { AndroidConfig, withDangerousMod } = require("expo/config-plugins");

// Release is offline. Only debug variants may contact the local Metro server.
module.exports = function withAndroidDebugNetwork(config) {
  return withDangerousMod(config, ["android", async (mod) => {
    for (const variant of ["debug", "debugOptimized"]) {
      const file = path.join(mod.modRequest.platformProjectRoot, "app", "src", variant, "AndroidManifest.xml");
      if (!fs.existsSync(file)) continue;
      const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(file);
      const permissions = manifest.manifest["uses-permission"] ?? [];
      if (!permissions.some((permission) => permission.$["android:name"] === "android.permission.INTERNET")) {
        permissions.push({ $: { "android:name": "android.permission.INTERNET" } });
        manifest.manifest["uses-permission"] = permissions;
        await AndroidConfig.Manifest.writeAndroidManifestAsync(file, manifest);
      }
    }
    return mod;
  }]);
};
