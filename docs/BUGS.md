# BUG & ISSUE TRACKER: SYNTHWAVE

This document records all bugs, runtime errors, performance bottlenecks, and edge cases discovered during development.

---

## Issue Status Legend
- 🟢 **RESOLVED**: Fix deployed and verified.
- 🟡 **IN PROGRESS**: Active investigation or fix being drafted.
- 🔴 **OPEN**: Confirmed issue awaiting resolution.
- ⚪ **KNOWN LIMITATION / BY DESIGN**: Intentional browser or hardware constraint documented for users.

---

## Issues Log

### BUG-001: PowerShell ExecutionPolicy Blocks Default `npm` and `npx` Invocations
- **Severity**: Medium (Tooling / Environment)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 0
- **Symptoms**:
  Running `npm --version` in Windows PowerShell throws:
  `File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system. (PSSecurityException / UnauthorizedAccess)`.
- **Root Cause**:
  Windows default execution policy (`Restricted`) prevents executing untrusted `.ps1` script wrappers located in `Program Files\nodejs`.
- **Resolution**:
  Invoke `npm.cmd` and `npx.cmd` directly in all shell commands, bypassing the PowerShell script wrapper without requiring elevated admin permissions.
- **Verification**:
  Executed `npm.cmd --version` and `npx.cmd --version`, which returned `11.19.0` successfully.

---

### BUG-002: Browser Autoplay Policy & AudioContext Suspension (Anticipated)
- **Severity**: Low (Browser Security Policy)
- **Status**: ⚪ DOCUMENTED PREVENTATIVE MEASURE
- **Discovered In**: Checkpoint 0
- **Symptoms**:
  Modern browsers (Chrome, Edge, Firefox) automatically suspend newly created `AudioContext` instances if created before a user interaction (click, tap, file selection).
- **Resolution Plan**:
  Ensure `AudioEngine.init()` is lazily activated or `audioContext.resume()` is explicitly triggered upon user file drop or initial "Play" button press.

---

### BUG-003: TS6133 Unused Local Identifiers during Production Build
- **Severity**: Low (TypeScript Compilation)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 1
- **Symptoms**:
  `tsc && vite build` failed with:
  `src/components/AudioPlayer/AudioPlayer.tsx(26,5): error TS6133: 'play' is declared but its value is never read.`
- **Root Cause**:
  `play` and `pause` were destructured from `useAudioStore()`, but `togglePlay` was used directly in the JSX handler. With `noUnusedLocals: true` in `tsconfig.json`, unused destructured variables trigger build failures.
- **Resolution**:
  Removed unused `play` and `pause` identifiers from `AudioPlayer.tsx`.
- **Verification**:
  `npm.cmd run build` compiled cleanly into production bundle with 0 errors.

---

### BUG-004: Split DOM Nodes Broke Exact String Assertion in Component Test
- **Severity**: Low (Test Harness)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 1
- **Symptoms**:
  `AudioPlayer.test.tsx` failed looking for `screen.getByText('00:00 / 00:00')`.
- **Root Cause**:
  The timecode in `AudioPlayer.tsx` was structured as separate styled span elements (`timeCurrent`, separator, and total time) for glowing neon styling.
- **Resolution**:
  Updated test assertion to check for the rendered time node elements.
- **Verification**:
  Vitest test suite passed with 21/21 tests green.

---

### BUG-005: Playwright Driver Download Blocked by Upstream CDN 404 in Browser Subagent
- **Severity**: Low (Automated Subagent Environment)
- **Status**: ⚪ DOCUMENTED PREVENTATIVE MEASURE / WORKAROUND
- **Discovered In**: Checkpoint 1
- **Symptoms**:
  `browser_subagent` failed to launch Playwright due to `got non 200 status code: 404` when downloading `playwright-1.57.0-win32_x64.zip` from azureedge CDN.
- **Resolution / Fallback**:
  Dev server health verified directly via `curl.exe -I http://127.0.0.1:5173/` (`HTTP/1.1 200 OK`). All audio player workflows, mock DOM interactions, and state mutations verified through the Vitest testing suite.

---

### BUG-006: TS2345 Type Incompatibility for Uint8Array in getByteFrequencyData
- **Severity**: Low (TypeScript Compilation)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 2
- **Symptoms**:
  `tsc && vite build` failed with:
  `src/audio/AudioEngine.ts(154,40): error TS2345: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'Uint8Array<ArrayBuffer>'`.
- **Root Cause**:
  In modern TypeScript 5.6+ with ES2020/ESNext types, default `Uint8Array` generic uses `ArrayBufferLike` which includes `SharedArrayBuffer`, whereas DOM `AnalyserNode` requires `Uint8Array<ArrayBuffer>`.
- **Resolution**:
  Cast buffer parameters to `Uint8Array<ArrayBuffer>` before passing to hardware analyser methods.
- **Verification**:
  `npm.cmd run build` compiled cleanly into production bundle with 0 errors.

---

### BUG-007: TS2322 Overload Mismatch on Mocking HTMLCanvasElement.prototype.getContext
- **Severity**: Low (Test Harness)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 2
- **Symptoms**:
  Mocking `HTMLCanvasElement.prototype.getContext` in `src/test/setup.ts` failed TypeScript compiler due to strict overloaded return types in DOM lib.
- **Resolution**:
  Used `(HTMLCanvasElement.prototype as any).getContext = ...` for the jsdom WebGL mock function.
- **Verification**:
  Vitest test suite ran 5 suites and 37 tests with 100% pass rate.

---

### BUG-008: TS6133 Unused Field 'container' in VisualizerCore
- **Severity**: Low (TypeScript Compilation)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 2
- **Symptoms**:
  `VisualizerCore.ts(6,11): error TS6133: 'container' is declared but its value is never read.`
- **Root Cause**:
  `private container: HTMLElement` was retained as an unused instance field.
- **Resolution**:
  Utilized `this.container` inside `dispose()` to guarantee clean unmounting of `this.renderer.domElement`.
- **Verification**:
  Production build compiled cleanly with 0 warnings.

---

### BUG-009: TS6133 Unused Type Import 'PresetConfig' in SidePanel.tsx
- **Severity**: Low (TypeScript Compilation)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 5
- **Symptoms**:
  `tsc && vite build` failed with:
  `src/components/SidePanel/SidePanel.tsx(20,3): error TS6133: 'PresetConfig' is declared but its value is never read.`
- **Root Cause**:
  `PresetConfig` was imported in `SidePanel.tsx` but not explicitly needed as a value or type in component JSX.
- **Resolution**:
  Removed unused import from `SidePanel.tsx`.
- **Verification**:
  `npm.cmd run build` compiled cleanly into production bundle with 0 errors.

---

### BUG-010: Hiding HUD Unmounted AudioPlayer and Stopped Audio Playback
- **Severity**: High (User Experience / Playback Continuity)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 6 / Post-Launch
- **Symptoms**:
  When clicking the "Hide UI" button in the top-right header (or pressing `H`), all UI hidden successfully but music playback immediately stopped, and mouse users had no visible UI button to unhide the controls.
- **Root Cause**:
  `App.tsx` conditionally rendered `<AudioPlayer />` with `{isHudVisible && <AudioPlayer />}`, which unmounted the component and destroyed its internal HTML5 `<audio>` DOM element, causing the browser to abort audio playback and sever Web Audio connectivity. Additionally, hiding `<Header />` unmounted the toggle button.
- **Resolution**:
  1. Refactored `<AudioPlayer />` to accept `isHudVisible?: boolean` prop and permanently mount `<audio ref={audioRef} ... />` outside the visible controls container.
  2. Permanently mounted `<AudioPlayer isHudVisible={isHudVisible} />` in `App.tsx` so audio streams remain connected at all times.
  3. Added a glowing floating neon toggle button (`<button id="btn-show-hud">` with `Eye` icon and "SHOW UI [H]") in `App.tsx` that appears in the top-right when the HUD is hidden, allowing mouse users to easily restore the HUD.
- **Verification**:
  Added unit test in `AudioPlayer.test.tsx` verifying the `<audio>` element stays mounted when `isHudVisible={false}`. Ran Vitest test suite (12 files, 75 tests passing) and production build (`tsc && vite build`).

---

### BUG-011: Center Text ("STREAMING AUDIO" / "STANDBY") Obstructed 3D Scenes
- **Severity**: Low (Visual UI / UX Polish)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 6 / Post-Launch
- **Symptoms**:
  In `ViewportContainer.tsx`, an overlay in the dead-center displayed "STREAMING AUDIO" (when playing) or "STANDBY" (when paused). This text overlay and the reticle rings sat right in the center of the 3D scene (blocking the sun in Synthwave Horizon, the core of Neon Tunnel, and the galaxy center in Particle Universe), remaining visible even when the HUD was hidden.
- **Root Cause**:
  `ViewportContainer.tsx` contained `{currentTrack && <div className={styles.stageNotice}>{playbackState === 'playing' ? 'STREAMING AUDIO' : 'STANDBY'}</div>}` inside `.centerReticle`.
- **Resolution**:
  1. Removed the center `stageNotice` text completely.
  2. Conditioned `.centerReticle` to render only when `!currentTrack` as a standby background element behind the dropzone card.
  3. Cleaned up unused `playbackState` import to maintain zero TypeScript warnings.
- **Verification**:
  Ran Vitest suite (12 files, 75 tests passing) and production build (`tsc && vite build`).

---

### BUG-012: HTMLMediaElement play() Interrupted by pause() on Track Transitions / loadedmetadata
- **Severity**: High (Playback Interruption & False Error Notification)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 7
- **Symptoms**:
  Clicking "Shuffle Play" or auto-advancing to the next song upon track end occasionally triggered a red banner:
  `Playback error: The play() request was interrupted by a call to pause().`
- **Root Cause**:
  1. `handleLoadedMetadata` in `AudioPlayer.tsx` contained an legacy call to `setPlaybackState('paused')`. When a track was queued to play (`playbackState: 'playing'`), `<audio>` initiated `audio.play()`. As soon as `<audio>` parsed track metadata, `handleLoadedMetadata` fired and set `playbackState: 'paused'`, causing `AudioPlayer`'s `useEffect` to invoke `audio.pause()` while `audio.play()`'s Promise was still pending.
  2. Browsers reject `play()` promises with `AbortError: The play() request was interrupted by a call to pause()` when `pause()` is invoked on an active in-flight play request. This standard W3C abort behavior was unhandled in the promise `.catch()` block, falsely triggering an application error banner.
- **Resolution**:
  1. Removed `setPlaybackState('paused')` from `handleLoadedMetadata` so tracks queued to play remain in their active `playing` state.
  2. Added `playPromiseRef` to track in-flight play requests; if `playbackState` shifts to `paused`, `pause()` now waits for the pending `playPromise` to resolve before executing.
  3. Explicitly caught and ignored standard `AbortError` / interruption rejections in the `playPromise.catch()` handler.
  4. Removed unnecessary intermediate `setPlaybackState('loading')` call in `playlistStore.ts` for pre-existing audio URLs.
- **Verification**:
  Added unit test `preserves active playing state when onLoadedMetadata fires` in `AudioPlayer.test.tsx`. Ran 14 test suites with 103/103 tests passing and confirmed clean production build.

---

### BUG-013: Camera FOV Became NaN when AudioMetrics.beatPulse was Undefined
- **Severity**: Medium (Visual Rendering Glitch in Unit Tests)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 10
- **Symptoms**:
  In mock test harnesses where `beatPulse` was omitted from `AudioMetrics`, camera FOV calculation `baseFov - metrics.beatPulse * 4` evaluated to `NaN`, preventing Three.js projection matrix updates.
- **Root Cause**:
  Direct mathematical operations assumed `metrics.beatPulse` was always a non-null number.
- **Resolution**:
  Guarded beat pulse evaluation: `const beatPulse = typeof metrics.beatPulse === 'number' ? metrics.beatPulse : 0;`.
- **Verification**:
  All unit tests for `NeonTunnelScene`, `SynthwaveHorizonScene`, and `VisualizerCore` execute with valid numerical projection matrices.

---

### BUG-014: Occlusion Ribbons Residual References on Scene Disposal
- **Severity**: Low (GPU Memory Cleanup)
- **Status**: 🟢 RESOLVED
- **Discovered In**: Checkpoint 10
- **Symptoms**:
  When tearing down `WaveformRidgelineScene`, the black depth-occlusion mesh ribbons underneath each spectrogram line remained in the scene graph if only the line objects were traversed.
- **Root Cause**:
  `this.lines` and `this.ribbons` were separate mesh collections.
- **Resolution**:
  Updated `WaveformRidgelineScene.dispose()` to explicitly traverse both `this.lines` and `this.ribbons`, disposing geometries and materials, and clearing all children from the root group.
- **Verification**:
  Verified in `WaveformRidgelineScene.test.ts` that `threeScene.children.length === 0` after `dispose()`.

---

### BUG-015: Playwright Driver 404 in Antigravity Browser Subagent Sandbox
- **Severity**: Low (External CDN Environment Limitation)
- **Status**: ⚪ KNOWN LIMITATION / ENVIRONMENT
- **Discovered In**: Checkpoint 10
- **Symptoms**:
  Invoking `browser_subagent` failed on `open_browser_url` because the sandbox attempted to fetch `playwright-1.57.0-win32_x64.zip` from Microsoft/Akamai CDNs which returned HTTP 404.
- **Root Cause**:
  The sandbox environment lacked a pre-installed Playwright browser binary and external CDN downloads are restricted or 404ing.
- **Resolution / Workaround**:
  The Vite dev server is running live on `http://127.0.0.1:5173/`. Verified the entire application via 22 automated Vitest test suites (152 tests passing), TypeScript static analysis, and Vite production bundle compilation. The user can open `http://localhost:5173/` directly in their browser.
- **Verification**:
  All 22 test files pass (100%); `tsc --noEmit` returns 0 errors; production build succeeds in 3.88s.

---

## Defect Summary
- Total Reported: 15
- Total Resolved: 12
- Open / In Progress: 0
- Documented Constraints: 3
- Current Status: 0 open defects (22 test files, 152 tests passing, production build succeeded cleanly).
