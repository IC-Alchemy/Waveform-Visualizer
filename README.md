# Interval Temperament Visualizer

A dependency-free, single-file WebGL2 temperament comparison tool.

The app compares equal temperament and just intonation for the interval derived from the selected X and Y keys. It keeps the runtime in `index.html` only: markup, CSS, state, controls, WebGL2 shaders, comparison rendering, optional Web Audio, PNG export, and event wiring all live in that file.

## Run

Open `index.html` in a WebGL2-capable browser.

For a local server:

```powershell
python -m http.server 5177 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5177/`.

## Native Android Port

A React Native / Expo Android port lives in `mobile/`. It keeps this single-file browser app as the reference implementation while rebuilding the visualizer with React Native Skia, audio with `react-native-audio-api`, and PNG export through Android sharing.

```powershell
cd mobile
npm install
npm run android
```

The native project uses Expo dev builds, not Expo Go, because it depends on native Skia and audio modules.

## What It Shows

- Two fixed C3-B4 piano keyboard graphics.
- The two piano keyboards stay side by side at the top of the comparison panel.
- Oscillator X is the just-intonation root note.
- Oscillator Y is the target note; the app derives the interval from the X and Y keys.
- In Just mode, Y frequency is recalculated from the selected X root by ratio; the fixed keyboard is a note-position guide, not a fully retuned just-intonation keyboard.
- A 3-way visual switch: `Equal`, `Just`, or `Both`.
- `Equal` and `Just` each use one large screen; `Both` shows two side-by-side screens beneath the piano row.
- Equal and just traces use distinct Material-style colors that are separate from the X/Y key highlight colors.
- Comparison readouts for selected notes, interval and semitones, equal ratio, just ratio, equal Y Hz, just Y Hz, Hz delta, and cents delta.

## Audio

Optional Web Audio monitoring is available but off by default. It starts only after a user gesture. When audio is enabled, a volume slider appears and controls the output level. The audio path uses two sine-like oscillators with slight soft clipping, making the tones easier to hear while preserving clear pitch. In `Both` visual mode, an audio-side selector chooses whether the heard Y oscillator follows the equal-tempered or just-intonation target.

## Export

PNG export is retained as a comparison image export when supported by the browser and GPU. The export path should preserve the current comparison view.

## Manuals

- [User Manual](USER_MANUAL.md) explains the visible controls, comparison readouts, audio behavior, export, and troubleshooting.
- [Developer Manual](DEVELOPER_MANUAL.md) explains the single-file architecture, state flow, WebGL2 comparison renderer, optional audio path, and maintenance rules.
- [Temperament And Tuning Reference](TEMPERAMENT_TUNING_REFERENCE.md) collects the ratios, cents, temperament tradeoffs, and Lissajous interpretation notes behind the comparison modes.
