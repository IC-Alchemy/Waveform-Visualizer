# Interval Temperament Visualizer Developer Manual

## Project Summary

Waveform Visualizer is a dependency-free single-page WebGL2 application. The full app lives in `index.html`, with project-level usage notes in `README.md`.

The product is a temperament comparison tool. It compares equal temperament and just intonation for the interval derived from selected X and Y keys using a WebGL2 XY trace, fixed C3-B4 piano keyboard graphics, comparison readouts, optional Web Audio, and PNG comparison export.

## Repository Layout

```text
Waveform-Visualizer/
  index.html              Main app: HTML, CSS, JavaScript, shaders, audio, export
  README.md               Short project overview and run instructions
  USER_MANUAL.md          End-user feature manual
  DEVELOPER_MANUAL.md     Developer architecture and maintenance manual
  mobile/                 Native Expo React Native Android app
```

The root browser app has no build system, package manager, bundler, or runtime dependency. The Android app has its own npm-managed native project under `mobile/`.

## Running Locally

The app can be opened directly:

```text
index.html
```

For a local HTTP server:

```powershell
python -m http.server 5177 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5177/
```

## Native Android Port

The Android app mirrors the browser control model through these files:

```text
mobile/App.tsx
mobile/src/model/oscilloscope.ts
mobile/src/components/Visualizer.tsx
mobile/src/components/ValueSlider.tsx
mobile/src/components/OptionModal.tsx
```

`mobile/src/model/oscilloscope.ts` contains the portable tuning and interval behavior: note conversion, equal and just temperament calculations, interval derivation, frequency clamping, and default app state. Tests live in `mobile/src/model/oscilloscope.test.ts`.

`mobile/src/components/Visualizer.tsx` is the native drawing surface. It does not reuse browser WebGL2 shaders; it samples the same two oscillator model into Skia paths and points, including waveform selection, amplitude, phase, offset, trace window, phosphor color, trail opacity, bloom-like glow, and freeze/resume behavior.

PNG export captures the Skia canvas, writes a PNG into the Expo cache directory, and opens Android sharing. The browser export path still uses WebGL readback and download.

Validate the mobile app with:

```powershell
cd mobile
npm run typecheck
npm test
```

## Browser Requirements

The app requires WebGL2 for the visual renderer. Optional audio uses standard Web Audio and must be started from a user gesture.

If WebGL2 is unavailable, the app should show a clear error instead of a blank screen.

## Architecture

The file has four major layers:

- HTML markup for the canvas, fixed piano keyboards, comparison readouts, controls, and export/audio buttons.
- CSS for the responsive app layout, presentation and normal mode sizing, keyboard graphics, control styling, and readable comparison panels.
- JavaScript state and DOM wiring for notes, intervals, visual mode, readouts, audio, and export.
- WebGL2 shaders and render loop for equal, just, and split comparison traces.

Keep implementation details inside the existing single-file structure unless the user explicitly asks for a larger refactor.

## Application State

The main mutable model is the `state` object.

```js
const state = {
  x: { wave: 0, freq: 110, amp: 0.74, phase: 0, offset: 0, note: "A2" },
  y: { wave: 0, freq: 164.81377845643496, amp: 0.74, phase: 90, offset: 0, note: "E3" },
  phaseMod: { enabled: false, rate: 0.01 },
  tuning: { freqMode: "interval", interval: "perfectFifth", temperament: "equal", referenceFreq: 110 },
  persistence: 0.972,
  intensity: 0.32,
  focus: 2.4,
  traceAntialias: 0.54,
  traceStyle: "hybrid",
  phosphorColor: [0.36, 1.0, 0.62],
  decay: 0.96,
  bloom: 0.82,
  window: 0.032,
  samples: 8192,
  exportScale: 2,
  exportSamples: 32768,
  frozen: false
};
```

### Oscillator Fields

`wave` is an integer enum used by the trace vertex shader:

- `0`: sine
- `1`: triangle
- `2`: soft square
- `3`: saw

`freq` is oscillator frequency in Hz.

`amp` scales output from `0` to `1`.

`phase` is a degree offset applied in the shader.

`offset` shifts the generated coordinate along that axis.

`note` stores the selected musical note for note and interval modes.

### Phase Modulation Fields

`phaseMod.enabled` controls whether the renderer adds a cyclic phase offset.

`phaseMod.rate` stores modulation frequency in Hz and is clamped from `0.001` to `0.1`.

The phase modulation control does not rewrite `state.x.phase` or `state.y.phase`; those remain the manual base phase values shown by the sliders.

### Tuning Fields

`freqMode` can be `hz`, `note`, or `interval`.

`interval` stores the selected interval key from `INTERVALS`.

`temperament` can be `equal` or `just`.

`referenceFreq` stores the Reference control value. Current note-frequency code does not fully use this as a global tuning reference, which is a known improvement target.

### Display Fields

Presentation mode is a UI layout flag, not a separate oscillator or renderer model. It should reuse the same `state` values as normal mode so compact frequency and amplitude controls stay synchronized with the full controls and the WebGL render loop.

`persistence` controls fade strength in the framebuffer fade pass.

`intensity` controls trace brightness in the trace fragment shader.

`focus` controls WebGL point size.

`traceAntialias` controls point falloff and local halo softness separately from point size.

`traceStyle` can be `hybrid`, `points`, or `lines`. Hybrid draws a connected `LINE_STRIP` plus point sprites.

`phosphorColor` is an RGB array sent to the trace and present shaders.

`decay` stores the shared decay multiplier that is combined with global persistence in the fade pass.

`bloom` controls how strongly the blurred bloom texture is mixed into the final present pass.

`window` controls the amount of oscillator time covered per frame.

`samples` controls how many GPU points are drawn per frame.

`exportScale` and `exportSamples` are one-shot overrides for PNG export. They do not alter live render resolution or live sample count.

`frozen` pauses simulation time and disables fading by sending `1.0` as persistence.

## Tuning Model

Musical note support is defined by:

- `NOTE_NAMES`
- `JUST_NOTE_RATIOS`
- `C4_EQUAL_FREQ`
- `INTERVALS`
- `INTERVAL_BY_VALUE`
- `MIN_NOTE_MIDI`
- `MAX_NOTE_MIDI`

Important functions:

`noteToMidi(note)` parses note strings such as `A2` into MIDI numbers.

`midiToNote(midi)` clamps a MIDI value to the supported range and returns a note string.

`noteFrequency(note)` converts a note to frequency using equal temperament or a just-ratio table.

`intervalRatio(value)` converts an interval key to either a just ratio or equal-tempered semitone ratio.

`applyNoteMode()` sets both oscillator frequencies from their selected notes.

`applyIntervalMode(anchor = "x")` derives one note from the other using the selected interval and sets Y from X plus the interval ratio.

`applyGlobalFrequencyMode(anchor = "x")` dispatches to Hz, Note, or Interval behavior.

## UI Wiring

The app uses DOM IDs and `data-*` attributes instead of a framework.

### Oscillator Controls

`wireOsc(section, osc)` attaches controls for one oscillator section.

It handles:

- waveform select
- frequency range input
- frequency number input
- note select
- amplitude slider
- phase slider
- offset slider

Frequency edits switch the global mode back to `hz`. Note edits switch the global mode to `note` and apply note-derived frequencies.

`oscControls` stores important DOM references for X and Y.

### Tuning Controls

`wireTuning()` populates the interval select, wires the mode select, wires temperament buttons, and wires the reference frequency input.

Temperament button clicks switch the app into `interval` mode before recalculating oscillator frequencies.

`syncGlobalModeControls()` keeps mode, interval, and note-control disabled states aligned with `state.tuning`.

### Display Controls

`wireDisplay()` binds the persistence, intensity, focus, trace antialias, decay, bloom, trace window, samples-per-frame, export scale, and export sample controls. It also wires trace style and phosphor color inputs.

Most display sliders use `bindNumberControl(input, out, getter, setter, format)` to update state and visible output text.

### Freeze

The Freeze button toggles `state.frozen`.

In the render loop:

- `simTime` stops advancing while frozen.
- fade persistence is forced to `1.0`.
- the button label changes between `Freeze` and `Resume`.

## WebGL Rendering Pipeline

The renderer uses five shader programs:

- fade program
- trace point program
- trace line program
- bloom program
- present program

The render loop runs once per animation frame.

### Buffers

Two framebuffer/texture pairs are created:

```js
const buffers = [
  { tex: gl.createTexture(), fb: gl.createFramebuffer() },
  { tex: gl.createTexture(), fb: gl.createFramebuffer() }
];
```

`readIndex` selects the previous frame buffer. The other buffer is the write target. After drawing, the indices swap.

This is the ping-pong persistence buffer.

### Resize

`resize()` computes canvas backing size from CSS size and device pixel ratio:

```js
const dpr = Math.min(window.devicePixelRatio || 1, 2);
```

The cap at `2` prevents very high-DPI screens from creating unnecessarily expensive framebuffers.

When size changes, the persistence and half-resolution bloom textures are reallocated, attached to framebuffers, cleared, and the viewport is updated.

### Pass 1: Fade

The fade pass renders a full-screen triangle into the write framebuffer.

Shader pair:

- `vertFull`
- `fragFade`

`fragFade` samples the previous texture and multiplies it by a `vec3 uDecay` value. JavaScript builds that value from global persistence and the shared decay control.

When frozen, JavaScript sends `1.0` so old pixels remain.

### Pass 2: Trace

The trace pass draws `state.samples` into the same write framebuffer using additive blending. In `hybrid` mode it draws a connected `LINE_STRIP` first, then point sprites over it. `points` and `lines` modes draw only their named path.

Shader pair:

- `vertTrace`
- `fragTrace`

The vertex shader computes oscillator values directly on the GPU. It uses `gl_VertexID` to derive sample position inside the trace window, so no vertex buffer is needed.

Important uniforms:

- `uTime`
- `uTraceWindow`
- `uSampleCount`
- `uPointSize`
- `uOscX`
- `uOscY`
- `uWaveX`
- `uWaveY`
- `uIntensity`
- `uAntialias`
- `uPhosphorColor`

`uOscX` and `uOscY` are packed as:

```text
justYHz = xRootHz * justIntervalRatio
```

When Phase Modulation is enabled, `setTraceUniforms()` uploads `state.y.phase + phaseModOffset` for `uOscY.z`. The stored Y phase slider remains unchanged; `phaseModOffset` is derived from `simTime`, so Freeze also pauses modulation and PNG export captures the current animated phase.

Do not treat the selected Y key as an absolute just-tuned note independent of X. X is the moving root.

The comparison readouts should be calculated from the same values sent to the renderer and audio path:

- `Hz delta = justYHz - equalYHz` or the documented signed/absolute convention used by the UI.
- `Cents delta = 1200 * log2(justYHz / equalYHz)`.

If the app displays rounded values, keep enough precision internally so small temperament differences do not disappear from the render or audio path.

## WebGL2 Renderer

The renderer should draw a live XY trace from oscillator uniforms. Oscillator X is the root. Oscillator Y is selected from the equal or just target depending on visual mode.

Expected render behavior:

- `Equal`: draw only the equal-tempered trace.
- `Just`: draw only the just-intonation trace.
- `Both`: draw two side-by-side panes in one frame using distinct Material-style colors.

The trace can still use the existing GPU-generated sample strategy, but keep sample count high enough for smooth curves and keep point sprites small enough that dots do not dominate the line. Legacy presentation passes and labels should not be described or reintroduced unless explicitly requested.

## Web Audio

Audio is optional and must remain off by default.

Implementation expectations:

- Create or resume audio only from a user gesture.
- Use two oscillators: X for root, Y for target.
- Keep user-facing oscillator shape selection hidden.
- Use sine oscillator sources through a slight soft-clipping stage so the tones are easier to hear while retaining sine-like pitch.
- Show a volume slider while audio is enabled and route it to the output gain level.
- Hide or remove shape controls from the user-facing audio path.
- In `Equal` visual mode, Y follows the equal target.
- In `Just` visual mode, Y follows the just target.
- In `Both` visual mode, Y follows the audio-side selector.
- Stop, disconnect, or mute cleanly when audio is disabled.

Use the same synchronized frequency values that drive the readouts and renderer.

## PNG Export

PNG export should remain available through the current canvas when the browser supports canvas PNG encoding.

The export should represent the current comparison view. The current implementation captures the WebGL canvas rather than the surrounding DOM readouts.

## Manual Test Checklist

After changing code, run through this checklist:

1. Open the app in a WebGL2-capable browser.
2. Confirm the default Interval / Perfect fifth pattern appears.
3. Confirm FPS and sample readouts update.
4. Move X and Y frequency sliders and confirm the trace changes.
5. Change either oscillator Note and confirm the app switches to `Note` mode.
6. Switch Mode to `Interval` and confirm interval changes affect Y relative to X.
7. Switch between `Equal` and `Just` and confirm interval-derived frequencies change where expected.
8. Test all four waveforms on both oscillators.
9. Adjust Persistence, Trace intensity, Focus, Trace antialias, Trace style, Phosphor color, Decay, Bloom, Trace window, and Samples/frame.
10. Test Freeze and Resume.
11. Resize the browser and confirm the canvas remains sharp and fills the stage.
12. Save a PNG at default export quality and confirm a non-empty download.
13. Test a narrow viewport to confirm the control panel moves below the display.

## Suggested Automated Tests

This project currently has no build step. If automated coverage is added, keep it lightweight and compatible with the static app:

- Pure function tests for note parsing, interval metadata, equal ratios, just ratios, frequency derivation, and cents delta.
- DOM smoke tests for root note, target note, visual-mode, audio-side, audio-volume, and readout synchronization.
- Browser smoke tests that verify WebGL initializes and produces nonblank pixels.
- Export smoke tests for canvas PNG download.
- Responsive layout checks for mobile-width overflow.

## Development Guidelines

- Keep the no-build single-file structure.
- Do not add frameworks, package managers, bundlers, or remote runtime dependencies for normal feature work.
- Keep musical comparison state as the source of truth.
- Update docs when visible behavior changes.
- Keep keyboard graphics, readouts, renderer uniforms, and audio frequencies synchronized through shared state application.
- Preserve the two-oscillator WebGL2 trace model.
- Prefer explicit metadata tables for notes and intervals over duplicated literals in UI handlers.
- Test visual changes in a browser-sized viewport, especially mobile layout changes.

## Common Extension Points

### Add or Adjust an Interval Ratio

1. Add or adjust the interval label, semitone count, and just ratio in the interval metadata.
2. Confirm the equal ratio is still derived from semitones.
3. Confirm keyboard-derived intervals continue to map to the expected label and ratio.
4. Update user-facing docs if ratio behavior changes.

### Add Presets

1. Serialize root note, target note, visual mode, and audio side.
2. Keep audio running state out of saved presets unless there is a clear user-facing reason.
3. Reapply through the normal synchronization path.

### Improve Export

1. Keep export dependency-free.
2. Reuse the current comparison renderer where possible.
3. Make clear whether DOM labels/readouts are included or only the WebGL canvas.
4. Test exported images for nonblank pixels.

## Areas That Can Be Improved

- Add named presets for common temperament comparisons.
- Add JSON import/export for comparison state.
- Add URL hash or query-string state for shareable comparisons.
- Add richer accessibility labels for piano keyboard graphics and live readouts.
- Add keyboard shortcuts for stepping root notes and intervals.
- Add a small browser smoke-test script for WebGL, export, audio start/stop, and responsive layout.
