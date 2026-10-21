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

## Android App

The native Android port lives in `mobile/`. It keeps the browser app as the behavioral reference, but rebuilds the product as an Expo React Native app with React Native Skia for the oscilloscope surface and Android sharing for PNG export.

Validate the native app:

```powershell
cd mobile
npm install
npm run typecheck
npm test
```

For current local APK/AAB build instructions, use [mobile/README.md](mobile/README.md).
The Android app is **Virtual Analog XY Oscilloscope**, package
`com.icalchemy.xyoscilloscope`. The older conversion reference is historical,
not the release procedure. Cloud builds and Play uploads are not authorized yet.

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
## Controls

- Oscillator X and Y: compact waveform/note selectors, frequency, amplitude, phase, and offset.
- Phase Modulation: optional slow Y-phase cycling, with a `0.001 Hz` to `0.1 Hz` modulation-rate slider.
- The top mode selector switches both oscillators between direct Hz, note selection, and interval mode.
- Note mode uses per-oscillator C0-B8 note selectors; interval mode uses one shared interval control to relate the two oscillator notes.
- Tuning supports equal temperament and just intonation for note and interval calculations; direct Hz mode stays unquantized.
- Small `i` buttons beside controls open hover/click help without expanding the panel.
- Presentation mode makes the WebGL waveform canvas the centerpiece and keeps compact frequency and amplitude controls available for live adjustment.
- Normal mode keeps the waveform visible while showing denser tuning, oscillator, display, renderer, freeze, and export controls.
- Display: collapsed controls for persistence, trace intensity, focus, trace antialiasing, trace style, phosphor color, decay, bloom, trace window, and samples per frame.
- Renderer: live performance stats plus export-quality PNG settings for temporary higher-resolution, higher-sample saved images.
- Freeze/resume keeps the current image on screen.

## Manuals

- [User Manual](USER_MANUAL.md) explains the visible controls, comparison readouts, audio behavior, export, and troubleshooting.
- [Developer Manual](DEVELOPER_MANUAL.md) explains the single-file architecture, state flow, WebGL2 comparison renderer, optional audio path, and maintenance rules.
