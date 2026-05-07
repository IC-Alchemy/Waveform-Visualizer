# Interval Temperament Visualizer User Manual

## Overview

Interval Temperament Visualizer is a browser-based temperament comparison tool. It uses a WebGL2 XY trace to compare how an interval looks in equal temperament versus just intonation.

The app uses two musical oscillators:

- Oscillator X is the just-intonation root.
- Oscillator Y is the selected target note. The interval is derived from the distance between X and Y.

The app runs entirely in `index.html`. It has no framework, package manager, build step, or remote runtime dependency. It requires a browser with WebGL2 support.

## Opening the App

Open `index.html` directly in a WebGL2-capable browser.

You can also run it through a local server:

```powershell
python -m http.server 5177 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5177/
```

## Main Display

The main display shows the interval relationship as an XY trace.

- X motion comes from the selected root note.
- Y motion comes from the selected target note.
- `Equal` shows the equal-tempered target trace.
- `Just` shows the just-intonation target trace.
- `Both` shows equal temperament and just intonation in two side-by-side screens.

The two fixed C3-B4 piano keyboard graphics stay at the top of the comparison panel, side by side, so the root and target notes can be read as musical positions, not just frequencies. The small `i` button on the piano row explains an important limitation: the keyboard graphic stays fixed, but Just mode treats X as the moving root and recalculates Y from that root by ratio.

## Core Controls

### Root Note

The root note selects Oscillator X. It is treated as the just-intonation root for the comparison.

The supported keyboard range is fixed from `C3` through `B4`.

In Just mode, changing the root changes the just-intonation reference. The target Y frequency is rebuilt from the selected X frequency and the chosen interval ratio.

### Target Note

The target note selects Oscillator Y. The app derives the semitone distance and interval name from the relationship between the selected X root and Y target.

Changing the target note updates the Y keyboard highlight, the interval name, the semitone distance, the equal-tempered ratio, the just-intonation ratio, and all frequency and difference readouts.

### Visual Mode

The visual mode switch has three options:

- `Equal`: render the equal-tempered version of the interval.
- `Just`: render the just-intonation version of the interval.
- `Both`: show two side-by-side screens beneath the piano row, with equal temperament on the left and just intonation on the right.

Use `Both` when you want to compare the two tuning systems without overlapping their traces on one screen.

The trace colors identify Equal and Just views only. They are intentionally different from the X/Y keyboard highlight colors so oscillator identity and temperament identity are not confused.

## Comparison Readouts

The comparison panel summarizes the current interval.

- `Notes`: the selected root and target note.
- `Interval / semitones`: the musical interval and its semitone distance.
- `Equal ratio`: the twelve-tone equal-tempered ratio for the interval.
- `Just ratio`: the simple harmonic ratio used for the just-intonation comparison.
- `Equal Y Hz`: the target Y frequency in equal temperament.
- `Just Y Hz`: the target Y frequency in just intonation.
- `Hz delta`: the absolute frequency difference between the equal and just Y targets.
- `Cents delta`: the pitch difference between the two Y targets in cents.

## Audio

Audio is optional and off by default.

Starting audio requires a user gesture, such as pressing the audio start button. This is required by browser audio policies.

When enabled, audio uses two Web Audio oscillators:

- X plays the selected root.
- Y plays the selected target.

A volume slider appears while audio is enabled. Use it to control the output level without changing the selected notes, ratios, readouts, or visual trace.

Oscillator shape controls are intentionally hidden; the audio path uses slightly soft-clipped sine oscillators so the tones are easier to hear while still retaining sine-like pitch. The comparison remains focused on tuning rather than waveform selection.

In `Both` visual mode, the audio-side selector chooses which Y target you hear:

- `Equal`: hear the equal-tempered Y frequency.
- `Just`: hear the just-intonation Y frequency.

Stopping or disabling audio should silence the oscillators without changing the visual comparison.

## PNG Export

PNG export saves the current comparison image from the visible WebGL canvas when the browser supports canvas PNG capture.

The exported image is intended to capture the comparison view.

If export fails, try a modern Chromium, Edge, or Firefox browser, reduce the browser window size, or use the live screen as the source for a manual screenshot.

## Troubleshooting

### The App Shows a WebGL2 Error

Use a modern browser with WebGL2 enabled. Some old GPUs, remote desktop sessions, or restricted browser settings may disable WebGL2.

### I Do Not Hear Audio

Audio starts off by default. Press the audio start control first, then check the in-app volume slider. Also check browser tab mute state, system output selection, and system volume.

### Both Mode Looks Like One Trace

Some intervals produce very small equal-versus-just differences. Check the `Hz delta` and `Cents delta` readouts to confirm whether the two targets are close.

### The Export Does Not Download

The browser may have rejected canvas PNG capture. Try a different WebGL2-capable browser or use the live screen as the source for a manual screenshot.

### The Layout Feels Tight on Mobile

Use a current mobile browser and rotate to a wider orientation if needed. The app should avoid horizontal overflow and keep controls touchable, but the piano graphics and comparison readouts need room.

## Areas That Can Be Improved

- Add saved comparison presets.
- Add JSON import/export for selected root, interval, visual mode, and audio side.
- Add keyboard shortcuts for interval stepping and audio toggling.
- Add clearer accessibility labels for keyboard graphics and dynamic readouts.
- Add browser smoke tests for WebGL rendering, audio start/stop, export, and mobile layout.
