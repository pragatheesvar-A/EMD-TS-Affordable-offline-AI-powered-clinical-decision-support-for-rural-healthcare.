# EMD-TS Mobile (Flutter)

The mobile front end for EMD-TS: patient registration, simulated
wearable vitals + animated ECG, explainable AI risk screening, patient
timeline, clinical copilot, smart referral, doctor dashboard, security
center (consent, tamper detection, unauthorized-access simulation),
blockchain audit trail, architecture & business-model reference pages,
settings, and a scripted end-to-end demo mode.

Talks to the companion `emd-ts-backend/` FastAPI server over HTTP, and
caches everything locally (`shared_preferences`) so the app keeps
working with degraded functionality when offline.

## Important — this project needs one setup step before it will build

This project was written file-by-file in a sandboxed environment
**without Flutter SDK access** (the sandbox's network policy blocks
`storage.googleapis.com` and `pub.dev`), so it could not be scaffolded
with `flutter create` or compiled/tested here. It ships as pure Dart
source (`lib/`) plus `pubspec.yaml` — **the `android/`, `ios/`, and
other platform folders are missing** and must be generated on your own
machine before `flutter run` will work.

### 1. Generate the platform folders

From inside this directory:

```bash
flutter create --org com.emdts --project-name emd_ts .
```

Running `flutter create .` **inside an existing project** is safe: it
only adds the missing platform folders (`android/`, `ios/`, etc.) and
does not overwrite `lib/` or `pubspec.yaml`.

### 2. Install dependencies

```bash
flutter pub get
```

### 3. Analyze (recommended — catches anything this environment
couldn't compile-check)

```bash
flutter analyze
```

If this reports errors, they're almost certainly quick fixes (an API
rename in a newer/older Flutter SDK version, etc.) — please share the
output and it can be corrected quickly.

### 4. Run

Start the backend first (see `../emd-ts-backend/README.md`), then:

```bash
flutter run
```

## Connecting to the backend

The default backend URL is chosen automatically:

- Android emulator: `http://10.0.2.2:8080` (the emulator's special
  alias for the host machine's `localhost`)
- iOS simulator / desktop / web: `http://localhost:8080`
- **Physical phone**: neither of the above works — go to **Settings →
  Backend Server** in the app and enter your computer's LAN IP, e.g.
  `http://192.168.1.20:8080`, then tap **Save** and **Test Connection**.

## Project layout

```
lib/
  main.dart                 App entry point, routes, base-URL detection
  models/                   Plain Dart data classes mirroring the backend's JSON contract
  services/
    api_service.dart        HTTP client wrapper (get/post/patch, error handling)
    storage_service.dart    SharedPreferences-based offline cache
    crypto_service.dart     SHA-256 helpers (display-only; backend is source of truth)
    vitals_simulator.dart   Simulated wearable vitals generator (NORMAL / HIGH_RISK)
    ecg_simulator.dart      Stylized PQRST waveform generator
    translations.dart       English/Tamil UI strings + multilingual demo constants
  state/app_state.dart      Provider/ChangeNotifier — single source of truth for the UI
  theme/app_theme.dart      Colors and ThemeData
  widgets/                  Shared widgets (cards, badges, ECG chart, trend chart, scaffold+drawer)
  screens/                  All 14 screens (see routes in main.dart)
```

## Screens (drawer navigation)

Dashboard · Patient Registration · Live Monitoring · AI Screening ·
Patient Timeline · Clinical Copilot · Smart Referral · Doctor
Dashboard · Security Center · Blockchain Audit · Architecture ·
Business Model · Settings · **Demo Mode** (scripted, run-through of
the entire product for a hackathon judge/investor walkthrough).

## Design decisions worth knowing

- **No `fl_chart` or other third-party charting package** — the ECG
  waveform and vitals trend chart are hand-rolled `CustomPainter`
  widgets (`widgets/ecg_widget.dart`, `widgets/trend_chart.dart`).
  This was a deliberate choice to avoid an untestable third-party
  dependency, since this environment could not run `flutter pub get`
  to verify one would resolve cleanly.
- **`.withOpacity()` instead of `.withValues(alpha:)`** — the newer
  `withValues` API only exists on very recent Flutter SDKs; `withOpacity`
  works everywhere (with a harmless deprecation warning on the newest
  SDKs) so the app builds regardless of which Flutter version you have
  installed.
- Every screen degrades gracefully when the backend is unreachable:
  cached data is shown with an "OFFLINE MODE" indicator in the app bar.

## If `flutter analyze` reports errors

Because this code could not be compiled in the authoring environment,
treat the first `flutter analyze` / `flutter run` as the real test
pass. Send back the exact error output (file + line + message) and it
can be fixed precisely — the most likely sources of any issue are
Flutter-SDK-version-specific API differences (e.g. a widget parameter
renamed between versions), not logic errors.
