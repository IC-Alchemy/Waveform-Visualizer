# Waveform Visualizer Android

Native Expo React Native port of the root `index.html` WebGL2 oscilloscope.

The browser app remains the behavioral reference. This Android app rebuilds the same two-oscillator XY visualizer with native React Native controls, React Native Skia drawing, and Android sharing for PNG export.

## Local Validation

```powershell
cd mobile
npm install
npm run typecheck
npm test
```

## Android Build

Follow the root conversion reference for the short-path Windows release build. The package id is:

```text
com.waveformviz.xyoscilloscope
```
