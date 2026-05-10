# Interval Temperament Mobile

Native Expo React Native port of the single-file browser visualizer.

## Run

Install dependencies from this folder if needed:

```powershell
npm install
```

Run a native Android dev build:

```powershell
npm run android
```

Start Metro for an already-installed dev build:

```powershell
npm start
```

## Implementation Notes

- `src/model/comparison.ts` is the pure TypeScript source of truth for note math, equal temperament, just-intonation ratios, readouts, and audio frequency selection.
- `src/components/Visualizer.tsx` rebuilds the live comparison display with React Native Skia instead of WebGL or HTML.
- `src/hooks/useAudioEngine.ts` uses `react-native-audio-api` for two sine oscillators, gain control, and WaveShaper soft clipping.
- PNG export captures the Skia canvas, writes a temporary cache file, and opens Android's share sheet.
- Animated export captures the live Skia canvas into a 3, 5, or 10 second GIF through `gifenc`, writes it to the Expo cache directory, and opens Android's share sheet.

The original `../index.html` remains the reference implementation while the native port is validated.
