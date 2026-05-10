# Interval Temperament Visualizer Developer Manual

## Project Summary

Interval Temperament Visualizer is a dependency-free single-page WebGL2 application. The full runtime lives in `index.html`, with project-level usage notes in `README.md`.

The product is a temperament comparison tool. It compares equal temperament and just intonation for the interval derived from selected X and Y keys using a WebGL2 XY trace, fixed C3-B4 piano keyboard graphics, comparison readouts, optional Web Audio, and PNG comparison export.

## Repository Layout

```text
Waveform-Visualizer/
  index.html              Main app: HTML, CSS, JavaScript, shaders, audio, export
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
python -m http.server 5177 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5177/
```

## Browser Requirements

The app requires WebGL2 for the visual renderer. Optional audio uses standard Web Audio and must be started from a user gesture.

If WebGL2 is unavailable, the app should show a clear error instead of a blank screen.

## Architecture

The file has four major layers:

- HTML markup for the canvas, fixed piano keyboards, comparison readouts, controls, and export/audio buttons.
- CSS for the responsive app layout, keyboard graphics, control styling, and readable comparison panels.
- JavaScript state and DOM wiring for notes, intervals, visual mode, readouts, audio, and export.
- WebGL2 shaders and render loop for equal, just, and split comparison traces.

Keep implementation details inside the existing single-file structure unless the user explicitly asks for a larger refactor.

## Product Model

The accepted behavior is:

- Two fixed piano keyboard graphics covering `C3` through `B4`.
- Piano graphics stay in a top two-column row in the main comparison panel.
- Oscillator X is the just-intonation root.
- Oscillator Y is the selected target note.
- The interval is derived from the semitone distance between X and Y.
- Equal temperament and just intonation are calculated for that same derived interval.
- Just intonation must build `justY` from the selected X frequency and the interval ratio, not from a fixed absolute Y tuning.
- The fixed keyboard graphics are note-position guides. A fully accurate just-intonation keyboard would need to be retuned for each selected X root, so the UI includes a small explanatory info control.
- Visual mode is a 3-way switch: `Equal`, `Just`, or `Both`.
- `Equal` and `Just` use one full-width render screen; `Both` splits the WebGL viewport into side-by-side Equal and Just screens beneath the piano row.
- Trace colors should identify temperament only and should not be reused as the X/Y oscillator highlight colors.
- Readouts include notes, interval and semitones, equal ratio, just ratio, equal Y Hz, just Y Hz, Hz delta, and cents delta.
- Optional Web Audio is off by default, starts only after a user gesture, exposes a volume slider while enabled, and uses two slightly soft-clipped sine oscillators.
- In `Both` visual mode, an audio-side selector chooses whether Y follows the equal or just target.
- PNG export is retained as comparison image export when possible.

Deprecated product behavior:

- Legacy display-effect framing.
- User-facing oscillator shape selection.
- General-purpose direct Hz oscillator editing as the main product mode.

## State Flow

State should keep the musical comparison as the source of truth:

- root note
- target note
- derived interval label and semitone distance
- equal ratio
- just ratio
- root frequency
- equal Y frequency
- just Y frequency
- selected visual mode
- selected audio side when visual mode is `Both`
- audio enabled/running state
- audio output volume
- export settings if exposed

When root or target note changes, update the derived interval, frequencies, ratios, readouts, keyboard highlights, visual uniforms, and audio oscillator frequencies through one synchronization path. Keep the volume control synchronized with the Web Audio gain path. Avoid letting DOM controls, audio, and renderer state diverge.

## Tuning Model

Equal temperament should use the standard twelve-tone semitone ratio:

```text
2 ** (semitones / 12)
```

Just intonation should use explicit simple ratios for supported intervals. Keep the ratio table readable and close to the interval metadata so the UI labels, semitone counts, and math stay aligned.

For just intonation, use:

```text
justYHz = xRootHz * justIntervalRatio
```

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

After changing runtime behavior, test in a WebGL2-capable browser:

1. Open the app and confirm it does not show a blank screen.
2. Confirm both C3-B4 keyboard graphics render.
3. Change the root note and confirm Oscillator X, keyboard highlights, readouts, and trace update.
4. Change the target note and confirm the semitone count, interval label, ratios, Y frequencies, deltas, and trace update.
5. Switch `Equal`, `Just`, and `Both` visual modes.
6. Confirm `Both` shows two side-by-side render screens beneath the piano row.
7. Confirm the piano-row info button opens and explains the fixed-keyboard limitation for just intonation.
8. Confirm changing X in Just mode recalculates the just Y frequency from the new X root.
9. Start audio from a user gesture and confirm the volume slider appears.
10. Confirm changing the volume slider changes output level without changing notes, readouts, or traces.
11. Confirm the two audio tones are sine-like but easier to hear because of the soft-clipped audio path.
12. In `Both`, switch the audio side between `Equal` and `Just` and confirm Y frequency changes.
13. Stop audio and confirm it silences without breaking visuals.
14. Save a PNG and confirm a non-empty comparison image downloads, if export is supported.
15. Test a narrow viewport and confirm there is no horizontal overflow and controls remain touchable.

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
