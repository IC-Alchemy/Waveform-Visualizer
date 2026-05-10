# Presentation Scope Android Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Expo React Native Android app to the approved Presentation Scope visual direction without changing app behavior.

**Architecture:** Keep the current component structure. Update centralized theme tokens first, then let the visualizer and controls consume those tokens for a waveform-first presentation layout.

**Tech Stack:** Expo 54, React Native 0.81, TypeScript, React Native Skia, `@react-native-community/slider`, Vitest.

---

## File Structure

- Modify `mobile/src/model/ui.ts` for theme token additions and palette tuning.
- Modify `mobile/src/components/Visualizer.tsx` for scope surface rendering and trace glow.
- Modify `mobile/src/components/SegmentedControl.tsx` for selected and pressed visual polish.
- Modify `mobile/src/components/NoteSelector.tsx` for keyboard styling and selected state clarity.
- Modify `mobile/src/components/ReadoutPanel.tsx` for denser, quieter readout presentation.
- Modify `mobile/App.tsx` for layout hierarchy, section styling, button polish, and visualizer sizing.

## Tasks

### Task 1: Theme Tokens

**Files:**
- Modify: `mobile/src/model/ui.ts`

- [ ] Add presentation tokens to `AppTheme`: `surfaceControl`, `surfaceControlMuted`, `divider`, `buttonDisabled`, `buttonDisabledText`, `traceGlowEqual`, `traceGlowJust`, and `visualizerFrame`.
- [ ] Tune light and dark palettes so the visualizer reads as a dark scope surface in both themes.
- [ ] Keep existing token names intact so current consumers keep compiling.
- [ ] Run `npm run typecheck` from `mobile/`.

### Task 2: Scope Visualizer

**Files:**
- Modify: `mobile/src/components/Visualizer.tsx`

- [ ] Use the new visualizer tokens for frame, labels, grid, and trace glow.
- [ ] Add a subtle frame layer and stronger glow pass behind each trace.
- [ ] Keep `capturePngBase64` and `captureRgbaFrame` behavior unchanged.
- [ ] Run `npm run typecheck` from `mobile/`.

### Task 3: Control Components

**Files:**
- Modify: `mobile/src/components/SegmentedControl.tsx`
- Modify: `mobile/src/components/NoteSelector.tsx`
- Modify: `mobile/src/components/ReadoutPanel.tsx`

- [ ] Add pressed states to segmented controls and clearer selected state styling.
- [ ] Improve piano selector contrast while preserving its current horizontal-scroll behavior.
- [ ] Rework readout rows into compact instrument-style metrics with existing values.
- [ ] Run `npm run typecheck` from `mobile/`.

### Task 4: App Layout and Integration

**Files:**
- Modify: `mobile/App.tsx`

- [ ] Increase portrait visualizer height and keep landscape visualizer dominant.
- [ ] Reduce section visual weight using control-surface tokens and tighter header hierarchy.
- [ ] Improve primary, secondary, disabled, audio, and export button states.
- [ ] Preserve all current controls and conditional behavior.
- [ ] Run `npm run typecheck` and `npm test` from `mobile/`.

### Task 5: Final Verification

**Files:**
- Review all modified files.

- [ ] Run `npm run typecheck` from `mobile/`.
- [ ] Run `npm test` from `mobile/`.
- [ ] Confirm `git diff --check` reports no whitespace errors.
- [ ] Confirm `.superpowers/` remains untracked and ignored.
