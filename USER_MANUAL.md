# Waveform Visualizer User Manual

## Overview

Waveform Visualizer is a browser-based XY oscilloscope. It uses two oscillators:

- Oscillator X controls the horizontal position of the trace.
- Oscillator Y controls the vertical position of the trace.

When both oscillators run at the same time, the display draws the relationship between them. Simple frequency ratios produce stable Lissajous figures. More complex ratios, phase offsets, and waveforms create rosettes, grids, folded shapes, and animated interference patterns.

The app runs entirely in `index.html`. It does not require installation or external libraries, but it does require a browser with WebGL2 support.

## Opening the App

Open `index.html` directly in a WebGL2-capable browser.

You can also run it through a local server:

```powershell
python -m http.server 5177
```

Then open:

```text
http://127.0.0.1:5177/
```

## Main Display

The large left area is the oscilloscope display.

- The bright green trace is the current XY oscillator path.
- The grid gives visual scale and center reference.
- The glow and fade simulate phosphor persistence on an analog oscilloscope.
- The top-left label shows that the app is in XY analog mode.
- The bottom-left readout shows the current X and Y frequencies plus live frame and sample counts.

The app is visual only. It does not currently output audio.

## Control Panel

The right panel contains all controls. On small screens, this panel moves below the display.

### Tuning

The Tuning section decides how oscillator frequencies are chosen.

#### Mode

`Mode` has three options.

`Hz` lets you set each oscillator frequency directly. This is the most freeform mode and is useful for experimental ratios, slow drift, and non-musical values.

`Note` lets you choose musical notes for X and Y. The app converts selected notes into frequencies.

`Interval` uses the X oscillator as the base note by default and sets the Y oscillator by a selected musical interval. For example, a perfect fifth makes Y run at a 3:2 ratio in just temperament or the equal-tempered equivalent in equal temperament.

Changing a frequency number or slider automatically returns the app to `Hz` mode because you are directly editing frequency values.

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

In `Note` mode, changing X Note changes X Frequency.

In `Interval` mode, changing X Note can move Y according to the selected interval.

#### Amplitude

`Amplitude` controls horizontal size.

At `0`, the X oscillator has no horizontal movement and the trace collapses toward a vertical line. At higher values, the trace spreads farther left and right.

#### Phase

`Phase` offsets the X oscillator timing in degrees from `-180` to `180`.

Phase changes the relationship between X and Y. A sine wave at the same frequency on both axes can become a diagonal line, ellipse, or circle depending on phase.

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

Chooses the Y musical note in `Note` mode. In `Interval` mode, Y is usually derived from X plus the selected interval.

#### Amplitude

Controls vertical size. At `0`, the trace collapses toward a horizontal line.

#### Phase

Offsets the Y oscillator timing. The default Y phase is `90` degrees, which helps the default X/Y sine settings open into a rounder Lissajous figure.

#### Offset

Moves the pattern up or down.

### Display

The Display section controls rendering style and performance.

#### Persistence

`Persistence` controls how slowly old trace data fades.

Lower values fade quickly and emphasize the current trace. Higher values keep trails longer and create a more analog phosphor look.

When the display is frozen, persistence is forced to full retention so the image remains on screen.

#### Trace Intensity

`Trace intensity` controls how strongly new trace samples are added to the persistence buffer.

Lower values make the trace dimmer and softer. Higher values make it brighter and can saturate the glow.

#### Focus

`Focus` controls point size in pixels.

Lower values create a sharper trace. Higher values create a thicker, softer trace with more glow.

#### Trace Window

`Trace window` controls how much oscillator time is drawn per frame.

Short windows draw a tighter current slice. Longer windows draw more time at once, which can reveal full figures faster but may make motion look denser.

The displayed value is shown in milliseconds.

#### Samples/frame

`Samples/frame` controls how many points the GPU draws each animation frame.

Higher values create smoother, denser traces but cost more GPU work. Lower values can improve performance on weaker devices but may make curves appear dotted or sparse.

### Preset Buttons

`Classic ratio` resets the app to a sine-based 110 Hz by 165 Hz relationship with a 90-degree Y phase. This is a 2:3 style Lissajous setup.

`Rosette` selects sine waves with a 97.5 Hz by 162.5 Hz relationship and a 37-degree Y phase. It creates a more floral or rosette-like figure.

`Square XY` uses a soft square X oscillator and triangle Y oscillator to create a boxier XY pattern.

`Freeze` pauses oscillator time and preserves the current image. The button changes to `Resume` while frozen. `Resume` continues animation from the paused state.

### Renderer Stats

The Renderer section shows live performance.

`Frame rate` is the approximate frames per second. It updates several times per second.

`GPU samples` shows the current samples-per-frame setting.

## Practical Examples

### Make a Circle or Ellipse

1. Set X Waveform to `Sine`.
2. Set Y Waveform to `Sine`.
3. Set X and Y Frequency to the same value.
4. Set Y Phase near `90 deg`.
5. Adjust X and Y Amplitude to change the shape.

### Make a Classic Lissajous Figure

1. Click `Classic ratio`.
2. Keep both waveforms as `Sine`.
3. Try changing X Frequency to `100` and Y Frequency to `150`.
4. Adjust Y Phase to rotate or reshape the figure.

### Explore Musical Intervals

1. Set Mode to `Interval`.
2. Choose X Note, such as `A2`.
3. Choose an Interval, such as `Perfect fifth` or `Octave`.
4. Switch between `Equal` and `Just` temperament and compare how stable the pattern looks.

### Create a Boxy Pattern

1. Click `Square XY`.
2. Increase Trace Intensity if the trace is too dim.
3. Lower Focus for sharper edges or raise Focus for softer phosphor glow.

## Troubleshooting

### The App Shows a WebGL2 Error

Use a modern browser with WebGL2 enabled. Current desktop versions of Chrome, Edge, and Firefox generally support WebGL2. Some remote desktop sessions, old GPUs, or restricted browser settings may disable it.

### The Trace Is Too Dim

Increase `Trace intensity`, increase `Persistence`, or raise `Focus`.

### The Trace Is Too Bright or Blown Out

Lower `Trace intensity` or `Persistence`.

### The App Feels Slow

Lower `Samples/frame`, lower `Focus`, or reduce the browser window size. High-DPI screens can require more GPU work because the canvas renders at device pixel ratio, capped at 2.

### Note Controls Are Disabled

The app is in `Hz` mode. Switch Mode to `Note` or `Interval`.

### Changing Frequency Leaves Note Mode

This is expected. Directly editing a frequency switches the app back to `Hz` mode so the typed or slider value remains authoritative.

## Areas That Can Be Improved

- Make `Reference` fully retune note and interval calculations instead of mostly storing the value.
- Add saved user presets so favorite settings can be named and reloaded.
- Add import/export for settings as JSON.
- Add audio output or optional Web Audio monitoring so users can hear the oscillator relationship.
- Add MIDI input for controlling frequency, note, amplitude, phase, or presets.
- Add tooltips or inline help for controls such as Trace Window, Focus, and Temperament.
- Add keyboard shortcuts for freeze/resume, preset switching, and fine parameter changes.
- Add a screenshot/export button for saving the current scope image.
- Add a reset button for display-only settings.
- Add mobile-specific control refinements for faster editing on touch screens.
- Add color themes or configurable phosphor colors.
- Add accessibility improvements, including clearer focus states and richer screen-reader descriptions.
