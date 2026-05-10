# Presentation Scope Android Design

## Context

The Android app is an Expo React Native port under `mobile/`. The browser `index.html` remains the functional reference, while `mobile/App.tsx`, `mobile/src/model/ui.ts`, and `mobile/src/components/Visualizer.tsx` define the native visual experience.

The selected direction is `Presentation Scope`: the waveform should dominate the first screen, controls should stay compact, and the app should feel more like a live oscilloscope display than a stack of equal-weight settings cards.

## Goals

- Make the Skia visualizer the clear centerpiece in portrait and landscape.
- Keep all existing behavior: note selection, Equal/Just/Both modes, readouts, audio enable/disable, audio side selection, PNG share, and animated GIF share.
- Improve the app's polish through theme tokens, spacing, pressed states, selected states, and clearer visual hierarchy.
- Preserve the existing React Native architecture and avoid broad refactors.

## Non-Goals

- Do not change comparison math, note ranges, temperament labels, or audio frequency selection.
- Do not replace Skia, Expo, or the native audio dependency.
- Do not redesign the app icon or splash screen in this pass.
- Do not remove detailed controls; reduce their visual weight instead.

## Design

The app should open with a darker, larger oscilloscope panel. The panel keeps the equal and just traces visually distinct, but uses a more dramatic stage/scope palette: cyan for equal, pink or warm magenta for just, a very dark scope background, subtle grid lines, glow around traces, and compact pane labels.

Portrait should remain one scrollable page, but the visualizer gets the strongest height allocation and the control sections become quieter. Configuration, view mode, notes, comparison data, audio, and export remain present. The sections should look like a compact control deck below the scope rather than independent content cards of equal importance.

Landscape should keep the existing split layout, with the visualizer column dominant and controls in a right rail. The header should not consume excessive height, and the visualizer should remain readable on tablet or landscape phone widths.

## Component Changes

- `mobile/src/model/ui.ts`: expand and tune theme tokens for the presentation palette, selected controls, disabled/exporting state, visualizer glow, elevated controls, and muted separators.
- `mobile/src/components/Visualizer.tsx`: make the shell feel like a scope viewport with stronger trace glow, improved pane separation, a darker canvas, better label styling, and subtle center/grid emphasis.
- `mobile/src/components/SegmentedControl.tsx`: improve selected and pressed affordances while keeping the generic API.
- `mobile/src/components/NoteSelector.tsx`: polish the piano selector with clearer selected keys, refined sharp/white key colors, and compact touch-friendly labels.
- `mobile/src/components/ReadoutPanel.tsx`: make readouts scan better in the quieter control deck.
- `mobile/App.tsx`: update layout, spacing, header hierarchy, section styling, button states, and visualizer sizing so the waveform leads.

## Validation

Run these from `mobile/`:

- `npm run typecheck`
- `npm test`

If dependencies or native build state require it, run `npm install` first. Visual QA should happen on an Android dev build or Expo web preview only as a supplemental check because the app depends on native Skia and audio modules for real Android behavior.

## Open Decisions

The selected visual direction is fixed: `Presentation Scope`. No unresolved design decisions block implementation.
