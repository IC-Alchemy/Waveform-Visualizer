# Waveform Visualizer

A dependency-free WebGL2 XY oscilloscope for exploring how two oscillators interact.

The renderer computes oscillator vertices in the GPU vertex shader, draws into a ping-pong persistence buffer, and presents the trace with phosphor glow, grid, scanline, vignette, and trail fade passes. The default settings open directly into a 2:3 Lissajous pattern.

## Run

Open `index.html` in a WebGL2-capable browser.

For a local server:

```powershell
python -m http.server 5177
```

Then open `http://127.0.0.1:5177/`.

## Controls

- Oscillator X and Y: waveform, frequency, amplitude, phase, and offset.
- Display: persistence, trace intensity, focus, trace window, and samples per frame.
- Presets: classic sine ratio, rosette, square XY, and freeze/resume.
