# Waveform Visualizer Developer Manual

## Project Summary

Waveform Visualizer is a dependency-free single-page WebGL2 application. The full app lives in `index.html`, with project-level usage notes in `README.md`.

The app renders an XY oscilloscope by evaluating two oscillators in a GPU vertex shader. Each generated point becomes a glowing phosphor sample. A ping-pong framebuffer pair keeps previous samples alive, fades them over time, and presents the final image with grid, glow, scanline, and vignette effects.

## Repository Layout

```text
Waveform Visualizer/
  index.html              Main app: HTML, CSS, JavaScript, shaders
  README.md               Short project overview and run instructions
  USER_MANUAL.md          End-user feature manual
  DEVELOPER_MANUAL.md     Developer architecture and maintenance manual
```

There is no build system, package manager, bundler, or runtime dependency.

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
  y: { wave: 0, freq: 165, amp: 0.74, phase: 90, offset: 0, note: "E3" },
  tuning: { freqMode: "hz", interval: "perfectFifth", temperament: "equal", referenceFreq: 110 },
  persistence: 0.972,
  intensity: 0.32,
  focus: 2.4,
  window: 0.032,
  samples: 8192,
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

`window` controls the amount of oscillator time covered per frame.

`samples` controls how many GPU points are drawn per frame.

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

Frequency edits switch the global mode back to `hz`. Note edits apply the active note or interval behavior.

`oscControls` stores important DOM references for X and Y.

### Tuning Controls

`wireTuning()` populates the interval select, wires the mode select, wires temperament buttons, and wires the reference frequency input.

`syncGlobalModeControls()` keeps mode, interval, and note-control disabled states aligned with `state.tuning`.

### Display Controls

`wireDisplay()` binds the persistence, intensity, focus, trace window, and samples-per-frame sliders.

Most display sliders use `bindNumberControl(input, out, getter, setter, format)` to update state and visible output text.

### Presets

`setPreset(preset)` currently supports:

- `classic`
- `rosette`
- `square`

Each preset mutates oscillator state and returns the tuning mode to `hz`.

After mutation, `syncControlsFromState()` pushes state values back into the DOM.

### Freeze

The Freeze button toggles `state.frozen`.

In the render loop:

- `simTime` stops advancing while frozen.
- fade persistence is forced to `1.0`.
- the button label changes between `Freeze` and `Resume`.

## WebGL Rendering Pipeline

The renderer uses three shader programs:

- fade program
- trace program
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

When size changes, both textures are reallocated as `RGBA8`, attached to framebuffers, cleared, and the viewport is updated.

### Pass 1: Fade

The fade pass renders a full-screen triangle into the write framebuffer.

Shader pair:

- `vertFull`
- `fragFade`

`fragFade` samples the previous texture and multiplies it by `uPersistence`.

When frozen, JavaScript sends `1.0` so old pixels remain.

### Pass 2: Trace

The trace pass draws `state.samples` points into the same write framebuffer using additive blending.

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

The fragment shader uses `gl_PointCoord` to create a bright core and soft halo for every point.

### Pass 3: Present

The present pass renders the latest write texture to the screen.

Shader pair:

- `vertFull`
- `fragPresent`

The present shader adds:

- horizontal and vertical blur taps for glow
- minor grid lines
- major grid lines
- center crosshair
- rounded scope mask
- vignette
- scanline modulation
- background tint

The result is clamped to `[0, 1]` before output.

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
2. Confirm the default 110 Hz / 165 Hz pattern appears.
3. Confirm FPS and sample readouts update.
4. Move X and Y frequency sliders and confirm the trace changes.
5. Switch Mode to `Note` and confirm note selectors affect frequency.
6. Switch Mode to `Interval` and confirm interval changes affect Y relative to X.
7. Switch between `Equal` and `Just` and confirm interval-derived frequencies change where expected.
8. Test all four waveforms on both oscillators.
9. Adjust Persistence, Trace intensity, Focus, Trace window, and Samples/frame.
10. Test Classic ratio, Rosette, Square XY, Freeze, and Resume.
11. Resize the browser and confirm the canvas remains sharp and fills the stage.
12. Test a narrow viewport to confirm the control panel moves below the display.

## Suggested Automated Tests

This project currently has no automated tests. If it grows beyond a single-file demo, useful tests would include:

- pure function tests for note parsing, MIDI conversion, interval ratios, and frequency clamping
- DOM tests for mode switching and disabled control states
- shader compile smoke tests in a headless browser
- Playwright visual smoke tests for default render, presets, and responsive layout
- performance smoke tests for high sample counts

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
- sync behavior when presets or modes change

When adding shader uniforms, update:

- shader source
- `loc` uniform lookup
- render-loop uniform upload

When changing framebuffer formats, test on multiple browsers and GPUs. `RGBA8` is widely supported and appropriate for the current glow buffer.

## Common Extension Points

### Add a New Waveform

1. Add an option to both waveform selects.
2. Assign the next integer enum value.
3. Add a branch to `osc(float t, int wave)` in `vertTrace`.
4. Test it on both X and Y.

### Add a New Preset

1. Add a button in the Display section.
2. Add a branch in `setPreset(preset)`.
3. Wire the button after `wireDisplay()`.
4. Call `syncControlsFromState()` after state mutation.

### Add Settings Export

1. Serialize the `state` object.
2. Decide whether live-only fields such as `frozen` should be included.
3. Download JSON through a Blob URL.
4. Add import validation before applying external state.
5. Call `syncControlsFromState()` and display sync functions after import.

### Add Audio

Use Web Audio oscillators or an AudioWorklet. Keep visual oscillator state and audio oscillator state synchronized through a shared state update path. Add a clear mute/output control because the current app is silent by design.

### Add MIDI

Use Web MIDI where available. Map MIDI CC or note input to state changes, then reuse existing setter/sync functions. Avoid bypassing state synchronization because that will make the visible controls drift from the actual renderer.

## Areas That Can Be Improved

### User-Facing Improvements

- Fully implement the `Reference` tuning control so A reference or base tuning affects note and interval calculations.
- Add save/load for custom presets.
- Add JSON import/export for full app state.
- Add screenshot export using `canvas.toBlob()` or an explicit render target export path.
- Add more waveform types, such as pulse width, noise, sample-and-hold, exponential curve, and custom harmonic blends.
- Add color and phosphor theme controls.
- Add optional audio output through Web Audio.
- Add MIDI input mappings for live control.
- Add richer onboarding help without cluttering the main panel.
- Add keyboard shortcuts and fine-adjust modifiers.

### Technical Improvements

- Split the single file into modules if the app starts growing beyond the current scope.
- Add unit tests for note, interval, and state synchronization logic.
- Add browser smoke tests that verify WebGL initializes and produces non-black pixels.
- Add a shader error overlay for development builds.
- Add URL hash or query-string state encoding for shareable presets.
- Add explicit validation for imported or future persisted state.
- Improve just-intonation note handling so key center and tuning reference are clear.
- Clarify whether `Reference` should represent A4, X base frequency, or a general tuning anchor.
- Add robust accessibility labels for grouped controls and dynamic readouts.
- Consider using floating-point framebuffer formats if future effects need higher dynamic range.
- Consider a low-power mode that reduces sample count, DPR, or present-shader glow taps.

### Code Quality Improvements

- Remove the unused `getter` parameter from `bindNumberControl()` or use it for reset/sync semantics.
- Centralize control metadata so min/max/step/format values are defined once.
- Make preset definitions data-driven instead of branching inside `setPreset()`.
- Add a small state apply function that handles mutation plus all required sync calls.
- Separate tuning math from DOM wiring so it can be tested without a browser.
- Give waveform enum values named constants to reduce reliance on magic numbers.
- Add comments around the shader pass sequence for future contributors.
