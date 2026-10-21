const { withAppBuildGradle } = require("expo/config-plugins");

const BEGIN = "// @generated begin withAndroidRelease";
const END = "// @generated end withAndroidRelease";
const LEGACY = "// Added by plugins/withAndroidRelease.js";

function removeGenerated(contents) {
  let cleaned = contents.replace(
    /^\/\/ @generated begin withAndroidRelease\r?\n[\s\S]*?^\/\/ @generated end withAndroidRelease[ \t]*(?:\r?\n|$)/gm,
    "",
  );
  // The original plugin emitted an unmarked-end android block, with only its
  // closing brace at column zero. Remove that exact layout, not unrelated code.
  cleaned = cleaned.replace(
    /^\/\/ Added by plugins\/withAndroidRelease\.js\r?\nandroid \{\r?\n[\s\S]*?^\}[ \t]*(?:\r?\n|$)/gm,
    "",
  );
  if ([BEGIN, END, LEGACY].some((marker) => cleaned.includes(marker))) {
    throw new Error("withAndroidRelease: malformed generated block; regenerate android/ with a clean prebuild.");
  }
  return cleaned.trimEnd();
}

// No paths or credentials from the local machine are interpolated into Gradle.
// Java Properties owns decoding (including backslashes); values never become code.
const GRADLE = `${BEGIN}
android {
    buildTypes {
        release {
            ndk {
                debugSymbolLevel "FULL"
            }
        }
    }
}

// EAS supplies its own signing config. Never read or override it with local keys.
if (System.getenv("EAS_BUILD") != "true") {
    def waveformKeystoreFile = rootProject.file("../keystore.properties")
    if (waveformKeystoreFile.exists()) {
        def waveformKeystore = new Properties()
        waveformKeystoreFile.withReader("UTF-8") { waveformKeystore.load(it) }
        def waveformMissing = ["storeFile", "storePassword", "keyAlias", "keyPassword"].findAll {
            !waveformKeystore.getProperty(it)?.trim()
        }
        if (!waveformMissing.isEmpty()) {
            throw new GradleException("keystore.properties is missing: " + waveformMissing.join(", ") +
                ". See keystore.properties.example.")
        }
        def waveformStoreFile = new File(waveformKeystore.getProperty("storeFile"))
        if (!waveformStoreFile.isAbsolute()) {
            waveformStoreFile = new File(waveformKeystoreFile.parentFile, waveformKeystore.getProperty("storeFile"))
        }
        if (!waveformStoreFile.isFile()) {
            throw new GradleException("keystore.properties storeFile must point to an existing keystore file.")
        }
        android {
            signingConfigs {
                waveformLocalRelease {
                    storeFile waveformStoreFile
                    storePassword waveformKeystore.getProperty("storePassword")
                    keyAlias waveformKeystore.getProperty("keyAlias")
                    keyPassword waveformKeystore.getProperty("keyPassword")
                }
            }
            buildTypes {
                release {
                    signingConfig signingConfigs.waveformLocalRelease
                }
            }
        }
    } else {
        logger.warn("[withAndroidRelease] No keystore.properties: release uses the template signing config (normally debug). Not Play-uploadable.")
    }
}
${END}`;

module.exports = function withAndroidRelease(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error(
        `withAndroidRelease: expected a Groovy build.gradle but prebuild produced ${mod.modResults.language}.`,
      );
    }
    mod.modResults.contents = `${removeGenerated(mod.modResults.contents)}\n\n${GRADLE}\n`;
    return mod;
  });
};
