# Waveform Visualizer

A dependency-free WebGL2 XY oscilloscope for exploring how two oscillators interact.

The renderer computes oscillator vertices in the GPU vertex shader, draws connected and point-based traces into a ping-pong persistence buffer, adds a separate bloom pass, and presents the trace with phosphor color, grid, scanline, vignette, and trail fade passes. The default settings open in interval mode with a perfect fifth relationship.

## Run

Open `index.html` in a WebGL2-capable browser.

For a local server:

```powershell
python -m http.server 5177
```

Then open `http://127.0.0.1:5177/`.

## Controls

- Oscillator X and Y: waveform, frequency, amplitude, phase, and offset.
- The top mode selector switches both oscillators between direct Hz, note selection, and interval mode.
- Note mode uses per-oscillator C0-B8 note selectors; interval mode uses one shared interval control to relate the two oscillator notes.
- Tuning supports equal temperament and just intonation for note and interval calculations; direct Hz mode stays unquantized.
- Display: collapsed controls for persistence, trace intensity, focus, trace antialiasing, trace style, phosphor color, decay, bloom, trace window, and samples per frame.
- Renderer: live performance stats plus export-quality PNG settings for temporary higher-resolution, higher-sample saved images.
- Freeze/resume keeps the current image on screen.

## Manuals

- [User Manual](USER_MANUAL.md) explains every visible control, mode, and troubleshooting path.
- [Developer Manual](DEVELOPER_MANUAL.md) explains the single-file architecture, WebGL2 render pipeline, state flow, and improvement areas.
