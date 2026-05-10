# Waveform Visualizer Developer Manual

## Project Summary

Waveform Visualizer started as a dependency-free single-page WebGL2 application. The browser app still lives in `index.html`, with project-level usage notes in `README.md`.

The native Android port lives in `mobile/`. It keeps the browser app as the behavior reference, but it is a real Expo React Native app rather than a WebView wrapper. The Android visualizer is rebuilt with React Native Skia and the app state is modeled in TypeScript.

The app renders an XY oscilloscope by evaluating two oscillators in a GPU vertex shader. Generated samples can be drawn as connected lines, point sprites, or both. A ping-pong framebuffer pair keeps previous samples alive, fades them over time with a shared decay value, runs a separate bloom pass, and presents the final image with grid, phosphor color, scanline, and vignette effects.

## Repository Layout

```text
Waveform Visualizer/
  index.html              Main app: HTML, CSS, JavaScript, shaders
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
python -m http.server 5177
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

The app requires WebGL2:

```js
const gl = canvas.getContext("webgl2", {
  antialias: false,
  alpha: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance",
  preserveDrawingBuffer: false
});
```

If WebGL2 is unavailable, the app replaces the document body with a short error message.

## High-Level Architecture

The file has four major layers:

- HTML markup defines the canvas, readouts, and right-side control panel.
- CSS defines the dark oscilloscope layout, responsive panel behavior, control styling, and scope surface.
- JavaScript state and UI wiring keep controls synchronized with the oscillator model.
- WebGL2 shaders and render loop generate, accumulate, and present the trace.

The app is wrapped in an immediately invoked function expression:

```js
(() => {
  "use strict";
  // app code
})();
```

This keeps implementation details out of global scope.

## Application State

The main mutable model is the `state` object.

```js
const state = {
  x: { wave: 0, freq: 110, amp: 0.74, phase: 0, offset: 0, note: "A2" },
  y: { wave: 0, freq: 164.81377845643496, amp: 0.74, phase: 90, offset: 0, note: "E3" },
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

### Tuning Fields

`freqMode` can be `hz`, `note`, or `interval`.

`interval` stores the selected interval key from `INTERVALS`.

`temperament` can be `equal` or `just`.

`referenceFreq` stores the Reference control value. Current note-frequency code does not fully use this as a global tuning reference, which is a known improvement target.

### Display Fields

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
frequency, amplitude, phase, offset
```

The shader clamps output coordinates slightly beyond normalized device coordinates:

```glsl
clamp(x, -1.08, 1.08)
clamp(y, -1.08, 1.08)
```

This allows edge glow while keeping geometry bounded.

The point fragment shader uses `gl_PointCoord` to create a bright core and soft halo for every point. The line fragment shader uses the same oscillator positions but avoids `gl_PointCoord`, which keeps the connected path valid for non-point primitives.

### Pass 3: Bloom

The bloom pass runs after trace accumulation and before final presentation.

Shader pair:

- `vertFull`
- `fragBloom`

The first bloom pass extracts bright trace energy and applies a horizontal blur into the first bloom buffer. The second pass vertically blurs that texture into the second bloom buffer. The live bloom targets run at half resolution to keep the pass affordable.

### Pass 4: Present

The present pass renders the latest write texture and bloom texture to the screen.

Shader pair:

- `vertFull`
- `fragPresent`

The present shader adds:

- bloom texture
- minor grid lines
- major grid lines
- center crosshair
- rounded scope mask
- vignette
- scanline modulation
- background tint

The result is clamped to `[0, 1]` before output.

### PNG Export

`saveExportImage()` renders a one-shot export through temporary offscreen framebuffers. It uses the current oscillator state, `max(state.samples, state.exportSamples)`, and a higher render target derived from `exportScale`. The export path reads back the final presented framebuffer, flips the pixel rows for canvas coordinates, encodes through a temporary 2D canvas, and triggers a PNG download.

Export dimensions are capped by the smaller of `MAX_TEXTURE_SIZE` and `4096` to avoid creating oversized render targets. The exported PNG contains the WebGL scope render only; DOM overlays are intentionally not captured.

## Performance Notes

The main performance controls are:

- framebuffer size
- device pixel ratio
- samples per frame
- point size/focus
- fragment cost in the present shader

The app avoids CPU-side vertex generation. The CPU only updates uniforms and UI state; the GPU generates all trace samples.

Potential bottlenecks:

- high `Samples/frame` values on integrated GPUs
- large browser windows on high-DPI screens
- large `Focus` values, because bigger points shade more pixels
- multiple texture samples in the present shader

## Error Handling

Shader compile and program link failures throw errors:

```js
throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
throw new Error(gl.getProgramInfoLog(p) || "Program link failed");
```

There is no user-facing shader failure UI. During development, use the browser console for shader and runtime errors.

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

This project currently has no automated tests. If it grows beyond a single-file demo, useful tests would include:

- pure function tests for note parsing, MIDI conversion, interval ratios, and frequency clamping
- DOM tests for mode switching and disabled control states
- shader compile smoke tests in a real WebGL browser
- Playwright visual smoke tests for default render, the collapsed Display section, and responsive layout
- performance smoke tests for high sample counts
- export smoke tests for framebuffer allocation and PNG download

## Development Guidelines

Keep the no-build single-file structure unless there is a clear reason to introduce tooling.

Prefer small, explicit functions over framework-style abstractions. The app is compact enough that direct DOM wiring is readable.

When adding state, update both:

- the `state` object
- the relevant control synchronization path

When adding a control, make sure it has:

- initial state value
- DOM markup
- output formatting if needed
- event listener
- sync behavior when modes change

When adding shader uniforms, update:

- shader source
- `loc` uniform lookup
- render-loop uniform upload

When changing framebuffer formats, test on multiple browsers and GPUs. The current path uses unsigned-byte RGBA textures for broad compatibility.

## Common Extension Points

### Add a New Waveform

1. Add an option to both waveform selects.
2. Assign the next integer enum value.
3. Add a branch to `osc(float t, int wave)` in `vertTrace`.
4. Test it on both X and Y.

### Add Settings Export

1. Serialize the `state` object.
2. Decide whether live-only fields such as `frozen` should be included.
3. Download JSON through a Blob URL.
4. Add import validation before applying external state.
5. Call tuning, oscillator, and display sync functions after import.

### Add Audio

Use Web Audio oscillators or an AudioWorklet. Keep visual oscillator state and audio oscillator state synchronized through a shared state update path. Add a clear mute/output control because the current app is silent by design.

### Add MIDI

Use Web MIDI where available. Map MIDI CC or note input to state changes, then reuse existing setter/sync functions. Avoid bypassing state synchronization because that will make the visible controls drift from the actual renderer.

## Areas That Can Be Improved

### User-Facing Improvements

- Fully implement the `Reference` tuning control so A reference or base tuning affects note and interval calculations.
- Add save/load for custom presets.
- Add JSON import/export for full app state.
- Add more waveform types, such as pulse width, noise, sample-and-hold, exponential curve, and custom harmonic blends.
- Add optional audio output through Web Audio.
- Add MIDI input mappings for live control.
- Add richer onboarding help without cluttering the main panel.
- Add keyboard shortcuts and fine-adjust modifiers.

### Technical Improvements

- Split the single file into modules if the app starts growing beyond the current scope.
- Add unit tests for note, interval, and state synchronization logic.
- Add browser smoke tests that verify WebGL initializes and produces non-black pixels.
- Add a shader error overlay for development builds.
- Add URL hash or query-string state encoding for shareable settings.
- Add explicit validation for imported or future persisted state.
- Improve just-intonation note handling so key center and tuning reference are clear.
- Clarify whether `Reference` should represent A4, X base frequency, or a general tuning anchor.
- Add robust accessibility labels for grouped controls and dynamic readouts.
- Consider using floating-point framebuffer formats if future effects need higher dynamic range.
- Consider a low-power mode that reduces sample count, DPR, or present-shader glow taps.

### Code Quality Improvements

- Remove the unused `getter` parameter from `bindNumberControl()` or use it for reset/sync semantics.
- Centralize control metadata so min/max/step/format values are defined once.
- Add a small state apply function that handles mutation plus all required sync calls.
- Separate tuning math from DOM wiring so it can be tested without a browser.
- Give waveform enum values named constants to reduce reliance on magic numbers.
- Add comments around the shader pass sequence for future contributors.
