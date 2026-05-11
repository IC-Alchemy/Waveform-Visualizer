# Interval Temperament Visualizer User Manual

## Overview

Interval Temperament Visualizer is a browser-based temperament comparison tool. It uses a WebGL2 XY trace to compare how an interval looks in equal temperament versus just intonation.

The app uses two musical oscillators:

- Oscillator X is the just-intonation root.
- Oscillator Y is the selected target note. The interval is derived from the distance between X and Y.

The browser version runs entirely in `index.html`. It has no framework, package manager, build step, or remote runtime dependency. It requires a browser with WebGL2 support.

A native Android version is also available under `mobile/`. It rebuilds the same two-oscillator oscilloscope as an Expo React Native app using native touch controls, a React Native Skia drawing surface, and Android's share sheet for PNG export.

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

## Android App

The Android app is built from `mobile/`.

For development validation:

```powershell
cd mobile
npm install
npm run typecheck
npm test
```

For a user-installable APK, follow the short-path `assembleRelease` workflow in `# Web App to Android App Conversion Reference.md`. The app opens directly as Waveform Visualizer; it is not a WebView wrapper and does not need a hosted website or Metro server when built as a release APK.

## Main Display

The oscilloscope display is a live WebGL waveform canvas.

- The bright green trace is the current XY oscillator path.
- The grid gives visual scale and center reference.
- The glow and fade simulate phosphor persistence on an analog oscilloscope.
- The top-left label shows that the app is in XY analog mode.
- The bottom-left readout shows the current X and Y frequencies plus live frame and sample counts.

The app is visual only. It does not currently output audio.

## Layout Modes

The app has two UI layouts for the same oscillator and renderer state.

`Presentation` mode makes the WebGL waveform canvas the centerpiece. It is intended for viewing, recording, or demonstrating patterns while still exposing small essential controls for X/Y frequency and amplitude.

Normal mode keeps the waveform visible in a smaller always-on scope area and shows the denser full control set for tuning, oscillator shape, phase, offset, display style, renderer settings, freeze/resume, and PNG export.

## Control Panel

In normal mode, the main control panel contains the full control set. On small screens, this panel moves below the display.

Waveform and Note selectors are grouped together to save vertical space. Small `i` buttons beside labels open short help popovers for the current control.

In Presentation mode, the compact controls are intentionally limited to frequent live adjustments. Switch back to normal mode when you need note, interval, temperament, waveform, phase, offset, display, renderer, freeze, or export controls.

On Android, the same controls are arranged as stacked touch sections below the live visualizer. Select-style controls open native modal lists, sliders include typed numeric entry, and PNG export opens the Android share sheet instead of downloading a file.

### Tuning

The Tuning section decides how oscillator frequencies are chosen.
The main display shows the interval relationship as an XY trace.

- X motion comes from the selected root note.
- Y motion comes from the selected target note.
- `Equal` shows the equal-tempered target trace.
- `Just` shows the just-intonation target trace.
- `Both` shows equal temperament and just intonation in two side-by-side screens.

The app opens in `Interval` mode with `Perfect fifth` selected.

#### Mode

`Mode` has three options.

`Hz` lets you set each oscillator frequency directly. This is the most freeform mode and is useful for experimental ratios, slow drift, and non-musical values.

`Note` lets you choose musical notes for X and Y. The app converts selected notes into frequencies.

`Interval` uses the X oscillator as the base note by default and sets the Y oscillator by a selected musical interval. For example, a perfect fifth makes Y run at a 3:2 ratio in just temperament or the equal-tempered equivalent in equal temperament.

Changing a frequency number or slider automatically returns the app to `Hz` mode because you are directly editing frequency values.

Changing either oscillator's note automatically switches the app to `Note` mode because you are directly choosing oscillator notes.

#### Interval

`Interval` is active only in `Interval` mode.

It chooses the musical relationship between X and Y. Available intervals range from unison through two octaves, including seconds, thirds, fourths, tritones, fifths, sixths, sevenths, and compound intervals.

Common examples:

- `Unison`: X and Y use the same pitch relationship.
- `Perfect fifth`: a stable 3:2 style relationship in just temperament.
- `Octave`: Y is twice X.
- `Two octaves`: Y is four times X.

#### Temperament

`Temperament` controls how note and interval frequencies are calculated.

`Equal` uses twelve-tone equal temperament. Each semitone is the same frequency ratio, and octave spacing is exact.

`Just` uses simple harmonic ratios for note classes and intervals. This can make some interval figures look more mathematically stable because ratios such as 3:2 or 5:4 are exact.

Direct `Hz` mode is not quantized by temperament.

#### Reference

`Reference` is a numeric tuning value in Hz. It is stored and clamped by the app, but the current note-frequency implementation mostly uses fixed A440/C4-derived calculations. A future version should make this control fully retune note and interval calculations.

### Oscillator X

Oscillator X controls horizontal motion.

#### Waveform

`Waveform` changes the shape of the horizontal signal.

`Sine` produces smooth circular and Lissajous curves.

`Triangle` produces linear ramps with sharp turns, useful for diamond-like and folded shapes.

`Soft square` produces a rounded square-like signal using a softened saturation curve. It creates boxier XY shapes without the harshest digital edges.

`Saw` produces a ramp signal that jumps back to its start. It creates slanted, combed, or scanning-style patterns.

#### Frequency

`Frequency` sets how fast the X oscillator cycles, from `0.1 Hz` to `520 Hz`.

The number field and slider control the same value. Higher frequencies produce more cycles in the trace window. Simple ratios with Y, such as `1:1`, `2:3`, `3:4`, or `3:5`, usually produce more stable figures.

#### Note

`Note` chooses a musical note from `C0` through `B8`. It is active in `Note` and `Interval` modes and disabled in direct `Hz` mode.

Changing X Note switches the app to `Note` mode and changes X Frequency.

#### Amplitude

`Amplitude` controls horizontal size.

At `0`, the X oscillator has no horizontal movement and the trace collapses toward a vertical line. At higher values, the trace spreads farther left and right.

#### Phase

`Phase` offsets the X oscillator timing in degrees from `-180` to `180`.

Phase changes the relationship between X and Y. A sine wave at the same frequency on both axes can become a diagonal line, ellipse, or circle depending on phase.

Phase Modulation is controlled beside the Y phase area because it changes the phase relationship between the two axes. When it is off, both phase sliders behave as fixed manual offsets.

#### Offset

`Offset` moves the X oscillator left or right.

Positive values shift the pattern right. Negative values shift it left. Large offsets can push parts of the trace toward the edge of the scope.

### Oscillator Y

Oscillator Y controls vertical motion. It has the same feature set as Oscillator X, but affects up/down position instead of left/right position.

#### Waveform

Changes the vertical signal shape: sine, triangle, soft square, or saw.

#### Frequency

Sets how fast the Y oscillator cycles, from `0.1 Hz` to `520 Hz`.

The X:Y frequency relationship is the main source of Lissajous pattern structure.

#### Note

Changing Y Note switches the app to `Note` mode and changes Y Frequency. In `Interval` mode, Y is otherwise derived from X plus the selected interval.

#### Amplitude

Controls vertical size. At `0`, the trace collapses toward a horizontal line.

#### Phase

Offsets the Y oscillator timing. The default Y phase is `90` degrees, which helps the default X/Y sine settings open into a rounder Lissajous figure.

`Phase Modulation` adds a slow cyclic offset to Y phase while preserving the visible X and Y Phase sliders as base values. The Mod rate slider sets the cycle speed from `0.001 Hz` to `0.1 Hz`, using the full slider width for slow drift control.

#### Offset

Moves the pattern up or down.

### Display

The Display section controls rendering style and performance. It is collapsed by default.

#### Persistence

`Persistence` controls how slowly old trace data fades.

Lower values fade quickly and emphasize the current trace. Higher values keep trails longer and create a more analog phosphor look.

When the display is frozen, persistence is forced to full retention so the image remains on screen.

#### Trace Intensity

`Trace intensity` controls how strongly new trace samples are added to the persistence buffer.

Lower values make the trace dimmer and softer. Higher values make it brighter and can saturate the glow.

#### Focus

`Focus` controls beam size in pixels.

Lower values create a thinner trace. Higher values create a thicker trace with more phosphor energy.
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

## Practical Examples

### Make a Circle or Ellipse

1. Set X Waveform to `Sine`.
2. Set Y Waveform to `Sine`.
3. Set X and Y Frequency to the same value.
4. Set Y Phase near `90 deg`.
5. Adjust X and Y Amplitude to change the shape.

### Make a Classic Lissajous Figure

1. Keep both waveforms as `Sine`.
2. Set X Frequency to `100`.
3. Set Y Frequency to `150`.
4. Adjust Y Phase to rotate or reshape the figure.

### Explore Musical Intervals

1. Use the startup `Interval` mode, or set Mode to `Interval`.
2. Choose X Note, such as `A2`.
3. Choose an Interval, such as `Perfect fifth` or `Octave`.
4. Switch between `Equal` and `Just` temperament and compare how stable the pattern looks.

### Animate the Phase Relationship

1. Start from a circle, ellipse, or simple interval figure.
2. Turn on `Phase Modulation`.
3. Set Mod rate near `0.005 Hz` for a very slow drift.
4. Raise Mod rate toward `0.05 Hz` or `0.1 Hz` for faster cyclic rotation.

### Create a Boxy Pattern

1. Set X Waveform to `Soft square`.
2. Set Y Waveform to `Triangle`.
3. Increase Trace Intensity if the trace is too dim.
4. Lower Focus for thinner edges, raise Bloom for more glow, or raise Trace antialias for smoother edges.
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
