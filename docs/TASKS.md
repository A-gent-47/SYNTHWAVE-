# TASKS & CHECKPOINT ROADMAP: SYNTHWAVE

This document tracks all planned, in-progress, and completed tasks across each development checkpoint.

---

## [x] Checkpoint 0 — Planning and Environment
- [x] Inspect local runtime environment (Node.js, npm, OS, permissions).
- [x] Identify Windows PowerShell execution policy constraint and establish workaround (`npm.cmd` / `npx.cmd`).
- [x] Create project specification document: `PROJECT_SPEC.md`.
- [x] Create checkpoint task roadmap: `TASKS.md`.
- [x] Create progress log: `PROGRESS.md`.
- [x] Create bug and issue tracker: `BUGS.md`.
- [x] Create project documentation: `README.md`.
- [x] Report findings to the user and await explicit approval for Checkpoint 1.

---

## [x] Checkpoint 1 — Functional Foundation
- [x] Initialize Vite + React + TypeScript application in `synthwave/`.
- [x] Configure TypeScript, Vite, and Vitest test harness.
- [x] Establish modern cyberpunk neon styling tokens (CSS variables) and base reset in `src/index.css`.
- [x] Implement `AudioPlayer` component:
  - [x] Drag-and-drop & file picker for local audio files (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`).
  - [x] Play, pause, seek scrubber, volume slider, mute toggle, and loop control.
  - [x] Real-time timecode display (`MM:SS / MM:SS`) and audio metadata display (file name, duration, format, size).
  - [x] Fallback, corrupt audio, and unreadable file error states with dismissible `ErrorAlert`.
  - [x] Procedural 80s Synthwave demo track generator (`generateSynthwaveDemoTrack`) for instant one-click testing.
- [x] Create layout shell:
  - [x] Top Cybernetic Header with status badge, branding, and clean HUD toggle.
  - [x] Central 3D canvas viewport container with smooth ResizeObserver.
  - [x] Bottom compact audio playback bar with responsive mobile/desktop layout.
  - [x] Collapsible side panel shells for settings and scene selection.
- [x] Verify audio playback on real audio files without Web Audio context blocks.
- [x] Run automated tests for audio player state logic (21 tests passing).
- [x] Update `TASKS.md`, `PROGRESS.md`, `BUGS.md`, and `README.md`.

---

## [x] Checkpoint 2 — Audio-Reactive Engine
- [x] Build `AudioEngine` singleton / service (`src/audio/AudioEngine.ts`):
  - [x] Instantiate `AudioContext` with user-gesture unlock handling (`init()`).
  - [x] Create `AnalyserNode` connected to audio element source node with `WeakMap` deduplication.
  - [x] FFT configuration: `fftSize = 1024`, `smoothingTimeConstant = 0.8`, 512 frequency bins.
  - [x] Frequency bin decomposition (`src/audio/audioMath.ts`):
    - [x] Bass band (20 Hz - 250 Hz)
    - [x] Mid band (250 Hz - 2500 Hz)
    - [x] Treble band (2500 Hz - 16000 Hz)
  - [x] Implement lerp attack/release smoothing algorithm to prevent visual twitching.
  - [x] Extract time-domain waveform data (oscilloscope ribbon).
- [x] Build initial WebGL Canvas test renderer using Three.js (`src/visualizer/VisualizerCore.ts`):
  - [x] Setup Three.js `Scene`, `PerspectiveCamera`, `WebGLRenderer` with DPR capped at 1.75.
  - [x] Create a prototype reactive geometry: audio-responsive pulsating morphing wireframe icosahedron with inner glowing nucleus.
  - [x] Connect audio metrics directly to geometry scale (bass), vertex displacement (mid), ambient and point light intensity (treble), and rotation speed.
  - [x] Create 3D circular oscilloscope waveform ribbon in Three.js reacting live to time-domain audio samples.
- [x] Add real-time DSP Equalizer HUD meter widget in `ViewportContainer` (Bass, Mids, Treble meters with live percentages).
- [x] Add unit tests for frequency band calculations and audio smoothing math (`audioMath.test.ts` & `AudioEngine.test.ts` - 37 total tests passing).
- [x] Update `PROJECT_SPEC.md`, `TASKS.md`, `PROGRESS.md`, `BUGS.md`, and `README.md`.

---

## [x] Checkpoint 3 — First Polished Scene: Neon Tunnel
- [x] Implement `NeonTunnelScene` (`src/visualizer/scenes/NeonTunnelScene.ts`):
  - [x] 50 concentric octagonal neon rings with alternating Cyberpunk emissive materials (Cyan, Magenta, Amber).
  - [x] Procedural tunnel extension with infinite recycling of passed rings.
  - [x] Audio-driven ring dilation (bass kicks pulse scale, mids generate traveling longitudinal ripple waves).
  - [x] 1,200 warp speed streaks / particle lines rushing down the central corridor with treble-driven velocity.
  - [x] Atmospheric neon depth fog (`#050508`) and dynamic travelling point light with drop color-shifting.
  - [x] Dynamic camera motion: velocity acceleration, rhythmic sway, roll, and bass FOV dilation.
- [x] Modular Scene Architecture:
  - [x] Created `VisualizerScene` base interface in `src/visualizer/scenes/SceneBase.ts`.
  - [x] Upgraded `VisualizerCore.ts` to manage active scenes, transitions, and delta-time updates.
- [x] Optimize rendering:
  - [x] Cap DPR at `min(window.devicePixelRatio, 1.75)` to prevent GPU throttling.
  - [x] Reused ring torus geometry and pre-allocated buffer attributes for zero GC frame overhead.
  - [x] Strict disposal lifecycle for geometries, materials, and particle systems.
- [x] Tested scene responsiveness across browser resizing and verified active badge in SidePanel.
- [x] Unit tests for `NeonTunnelScene` lifecycle and update loops (42 total project tests passing).
- [x] Update `TASKS.md`, `PROGRESS.md`, `BUGS.md`, and `README.md`.

---

## [x] Checkpoint 4 — Additional Scenes: Particle Universe & Synthwave Horizon
- [x] Implement `ParticleUniverseScene` (`src/visualizer/scenes/ParticleUniverseScene.ts`):
  - [x] 8,000+ 3D celestial particle nebula using `THREE.Points` with spiral arms and spherical halo.
  - [x] Audio-driven radial shockwaves: bass drops trigger outward burst expansion and smooth gravitational return.
  - [x] Mid-frequency orbital curl and harmonic sinusoidal turbulence displacement.
  - [x] Treble-driven particle scintillation, size pulsing, and central glowing pulsar core.
  - [x] Cinematic orbiting camera with bass-reactive radius breathing.
- [x] Implement `SynthwaveHorizonScene` (`src/visualizer/scenes/SynthwaveHorizonScene.ts`):
  - [x] Infinite retro wireframe neon ground grid flowing toward the horizon with procedural Z-offset recycling.
  - [x] Glowing segmented 1980s synthwave sunset on the horizon with 9 progressive horizontal slat slices.
  - [x] Flanking low-poly procedural mountain ranges on left and right with bass-reactive ridged peak displacement.
  - [x] 1,000-star celestial dome backdrop in upper hemisphere.
  - [x] Gliding camera hover above grid plane toward the sunset.
- [x] Implement `SceneManager` & `visualizerStore`:
  - [x] Registry of all 3 official scenes with shortcuts (`1`, `2`, `3`), names, titles, and descriptions.
  - [x] Instant scene switching via UI side drawer and keyboard shortcuts (`1`, `2`, `3`).
  - [x] Complete WebGL resource cleanup (dispose old geometries, materials, buffers) to prevent memory leaks.
  - [x] Continuous audio playback without interruptions during scene switches.
- [x] Unit tests for `ParticleUniverseScene`, `SynthwaveHorizonScene`, `SceneManager`, and `visualizerStore` (59 total tests passing).
- [x] Update `TASKS.md`, `PROGRESS.md`, `BUGS.md`, and `README.md`.

---

## [x] Checkpoint 5 — Controls and Presets
- [x] Build `CustomizationPanel` in `SidePanel.tsx`:
  - [x] Sensitivity sliders: Bass, Mids, Treble (0.1x to 3.0x with dynamic clamping).
  - [x] Visual settings: Particle density, camera shake toggle & intensity, motion speed, bloom intensity.
  - [x] Color palette selector (Cyberpunk Neon, Deep Space, Electric Violet, Retro Sunset, Monochrome Voltage).
  - [x] Auto-scene switcher toggle (30s interval rotation across all 3 environments).
  - [x] Visual animation pause (freeze frame for inspection while audio continues uninterrupted).
  - [x] Reset to factory defaults button (`[Key R]`).
- [x] Implement Preset System (`src/visualizer/presets.ts` & `src/store/visualizerStore.ts`):
  - [x] Ship with 5 built-in presets: Cyberpunk Neon, Deep Space, Electric Violet, Retro Sunset, Monochrome Voltage.
  - [x] Custom preset creation, saving to `localStorage`, loading, and deletion.
  - [x] JSON export and import for sharing presets with schema validation.
- [x] Global Keyboard Shortcuts (`src/App.tsx`):
  - [x] `Space` (Play/Pause), `M` (Mute), `F` (Fullscreen), `H` (Toggle HUD), `1-3` (Scenes), `R` (Reset defaults), `P` (Pause/Freeze visuals), `ArrowLeft`/`ArrowRight` (Seek +/- 5s).
  - [x] Guard keyboard shortcuts so they never fire when typing in text inputs or textareas.
- [x] Unit test suite (`src/visualizer/presets.test.ts`, `src/store/visualizerStore.test.ts`, `src/audio/AudioEngine.test.ts`): 11 test files, 69 tests passing.
- [x] Update `TASKS.md`, `PROGRESS.md`, `BUGS.md`, and `README.md`.

---

## [x] Checkpoint 6 — Final Polish, QA, and Delivery
- [x] Comprehensive cross-browser / responsive layout QA:
  - [x] Mobile/tablet landscape, standard 1080p laptop, and 4K displays (adaptive padding, collapsible dock, compact widgets).
  - [x] Handle WebGL context lost (`webglcontextlost`) and restored (`webglcontextrestored`) events gracefully without crashing.
- [x] Performance profiling & optimization:
  - [x] Cap device pixel ratio (`Math.min(devicePixelRatio, 1.75)`).
  - [x] "Reduced Effects" mode toggle for power-saving & low-power hardware (reduces DPR to 1.0, disables camera shake, eases particle load).
  - [x] Zero-GC animation loops with in-place buffer attribute updates.
- [x] Automated testing suite:
  - [x] Full Vitest suite passing with 12 test files and 74/74 unit/component tests (100% pass rate).
  - [x] Zero TypeScript compilation errors (`tsc --noEmit`).
  - [x] Production build passes cleanly (`npm.cmd run build` in 3.11s).
- [x] Update documentation (`TASKS.md`, `PROGRESS.md`, `BUGS.md`, `README.md`).
- [x] Final handover report.

---

## [x] Checkpoint 7 — Playlist & Music Library
- [x] Data Models & Types (`src/types/playlist.ts`):
  - [x] `LibraryTrack`, `Playlist`, `RepeatMode` ('off', 'all', 'one'), `SortField`, `SortOrder`.
  - [x] Serialized interfaces for metadata storage.
- [x] Audio Metadata & Duplicate Detection (`src/utils/audioMetadata.ts`):
  - [x] Heuristic parsing for Artist, Title, and Album from filenames.
  - [x] Deterministic FNV-1a track ID hashing preventing accidental duplicate imports.
- [x] Privacy-First Local Persistence (`src/utils/playlistStorage.ts`):
  - [x] Persist playlist names, track ordering, favourites, shuffle, and repeat modes to `localStorage`.
  - [x] Zero cloud uploads and zero audio blob storage in `localStorage`.
  - [x] Mark local files as `isUnavailable` upon reload until reselected, with clear UI indicators.
  - [x] Auto-generate blobs for demo tracks across sessions.
- [x] Playlist & Library State Store (`src/store/playlistStore.ts`):
  - [x] Create, rename, delete, and clear playlists.
  - [x] Add tracks to playlists with duplicate prevention per playlist.
  - [x] Reorder tracks via drag-and-drop and accessible buttons.
  - [x] Playback navigation: `playTrack`, `playNext`, `playPrevious`.
  - [x] Shuffle: non-repeating permutation without immediate repeat of current track.
  - [x] Repeat modes: `off`, `all` (loop queue), `one` (loop single track).
  - [x] Playback queue management: add to queue, remove, clear, and reorder.
  - [x] Search filtering by title, artist, and album.
  - [x] Multi-field sorting (Title, Artist, Album, Duration, Date Added).
  - [x] Favourites toggling with dedicated Favourites view.
- [x] UI & Layout Components:
  - [x] `LibraryView` (`src/components/Library/LibraryView.tsx`):
    - [x] Navigation sidebar with All Tracks, Favourites, and custom playlists.
    - [x] Header toolbar with Play All, Shuffle Play, Import Files, Add Demo, and Clear Playlist.
    - [x] Search input and Sort selector with Asc/Desc order toggle.
    - [x] Track table with row click-to-play, duration, favorite heart, and context actions.
    - [x] Confirmation modals for creating, renaming, deleting, and clearing playlists.
  - [x] `QueueDrawer` (`src/components/Queue/QueueDrawer.tsx`):
    - [x] Slide-out cyber panel displaying Now Playing and Up Next tracks.
    - [x] Track removal, queue clearing, and reordering.
  - [x] `AudioPlayer` (`src/components/AudioPlayer/AudioPlayer.tsx`):
    - [x] Integrated Previous, Next, Shuffle, Repeat (3 states), Library, and Queue buttons.
    - [x] Auto-advance on track end respecting active `repeatMode`.
  - [x] `Header` (`src/components/Header/Header.tsx`):
    - [x] Multi-file import support and dedicated Library toggle button.
  - [x] `App` (`src/App.tsx`):
    - [x] Window-level multi-file drag-and-drop batch import.
    - [x] Keyboard shortcuts: `L` (Library), `Q` (Queue), `N` (Next), `B` (Previous), `S` (Shuffle).
- [x] Visualizer & Web Audio Compatibility:
  - [x] Shares identical HTML5 Audio Element and Web Audio `AudioEngine` singleton.
  - [x] 100% audio continuity across library browsing, queue mutations, and scene switches.
- [x] Automated Testing & Verification:
  - [x] 14 test files, 102 tests passing (100% pass rate).
  - [x] Production build clean in 3.20s with 0 errors.

---

## [x] Checkpoint 8 — Minimalist Studio UI Redesign & Restore Point
- [x] Mandatory Step 0: Create and verify physical filesystem restore point at `.restore-points/pre-ui-redesign/`:
  - [x] Check Git availability (fallback to physical file backup).
  - [x] Backup `src/` (all 70 files), `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, and all 5 markdown documentation files.
  - [x] Verify backup directory contents.
- [x] Global Design Tokens & Typography (`src/index.css`):
  - [x] Matte obsidian/charcoal surfaces (`#09090b`, `#12131a`, `#181922`) with smoked glass panels.
  - [x] Crisp hairline borders (`1px solid rgba(255, 255, 255, 0.08)`).
  - [x] Replaced `Orbitron` display headers with clean `Inter` in Sentence/Title Case.
  - [x] Reserved `JetBrains Mono` strictly for metrics, file sizes, and timecodes.
  - [x] Neutral high-contrast white text (`#f4f4f6`) with controlled refined accent (`#00e5ff`).
  - [x] Removed scanline overlays and background grid lines behind UI.
- [x] Fix Overlap Bug & HUD De-cluttering (`ViewportContainer` & `SidePanel`):
  - [x] Moved `DSP EQUALIZER` widget to bottom-left (`bottom: 1.25rem; left: 1.5rem`).
  - [x] Consolidated `SCENES | PRESETS | CONFIG` into unified top-right segmented pill dock (`top: 1.25rem; right: 1.5rem`).
  - [x] Confirmed zero overlap across all viewport resolutions.
  - [x] Removed sci-fi `//` telemetry text clutter (`VIEWPORT // ...`, `AUDIO BUFFER // ...`).
  - [x] Replaced permanent keyboard shortcuts box with bottom-right interactive `?` popover button.
- [x] Studio Component Redesign:
  - [x] `Header`: Slim 52px top bar, clean sans wordmark, understated status indicator, cohesive 32px studio buttons.
  - [x] `FileDropzone`: Compact 420px dark-glass card, clean typography, solid white primary button, subtle demo button.
  - [x] `AudioPlayer`: Modern 72px transport dock, 3px top scrubber, 40px solid white play button, clean icon controls with active indicator dots.
  - [x] `SidePanel`: Frosted dark-glass studio inspector drawer with clean sliders and preset cards.
  - [x] `LibraryView`: Subtle sidebar, solid `Play All` button, calm track table with subtle dividers and hover-revealed row actions.
  - [x] `QueueDrawer`: Frosted dark-glass queue inspector with clean Sentence Case headers.
  - [x] `ErrorAlert`: Clean studio notification banner.
- [x] Compatibility & Functionality Preservation:
  - [x] Preserved 100% of Web Audio and Three.js 3D visualizer pipelines.
  - [x] Preserved all accessible selectors, `aria-label`, `data-testid`, and test IDs.
- [x] Testing & Build Verification:
  - [x] 14 test files, 103 tests passing (100% pass rate).
  - [x] Production build clean in 3.21s with 0 errors.

---

## [x] Checkpoint 9 — Expanded 3D Visualizer Scene Library (4 New Scenes)
- [x] Mandatory Step 0: Created physical filesystem backup at `.restore-points/pre-new-scenes/`:
  - [x] Backed up `src/` directory and all markdown documentation files (`PROJECT_SPEC.md`, `TASKS.md`, `PROGRESS.md`, `BUGS.md`, `README.md`).
  - [x] Verified full backup presence with PowerShell.
- [x] Implemented 4 New 3D Visualizer Scenes extending `SceneBase`:
  - [x] `CrystalLatticeScene` (`src/visualizer/scenes/CrystalLatticeScene.ts`):
    - [x] 125-crystal 3D lattice matrix ($5 \times 5 \times 5$) of geometric shards with frequency-layered wireframe outer facets and inner emissive core nodes.
    - [x] Radiating bass shockwaves with orbital camera breathing.
    - [x] Mids modulate crystal rotation speed, lattice expansion, and internal facet glow.
    - [x] Treble sparks trigger crystalline facet scintillation and inner core flash bursts.
  - [x] `CyberCityScene` (`src/visualizer/scenes/CyberCityScene.ts`):
    - [x] Endless procedural scrolling synthwave metropolis of audio-reactive neon skyscrapers flanked by a glowing retro road grid and horizon sunset.
    - [x] Bass drives skyscraper height extrusion and pulse ripples across building blocks.
    - [x] Mids modulate neon window segment brightness and color transitions.
    - [x] Treble triggers horizon sunset corona flares and street lighting intensity spikes.
  - [x] `DNAHelixScene` (`src/visualizer/scenes/DNAHelixScene.ts`):
    - [x] Twisting vertical cybernetic double helix with 80 nucleotide pairs, cross-bridge base pairs, and orbiting atmospheric plasma particles.
    - [x] Bass expands the helix radius and increases axial rotation rate.
    - [x] Mids and live frequency bins scale the thickness, height, and reach of connecting base pair rungs.
    - [x] Treble accelerates particle drift and modulates dynamic point lights traveling through the core.
  - [x] `PlasmaVortexScene` (`src/visualizer/scenes/PlasmaVortexScene.ts`):
    - [x] Hourglass plasma vortex funnel with 48 spiraling rings, 3,600 swirling particles, arc lightning bolts, and a central pulsating energy core.
    - [x] Bass drives violent core eruptions, shockwave expansions, and camera FOV thumps.
    - [x] Mids modulate vortex ring twist, spiral velocity, and harmonic constriction.
    - [x] Treble sparks trigger dynamic electrical lightning discharges between opposite vortex rims.
- [x] System Integration & UI Updates:
  - [x] Extended `SceneId` union in `presets.ts` to include all 7 scenes.
  - [x] Registered all 7 scenes in `SceneManager.ts` with shortcuts `1`–`7` and rich metadata.
  - [x] Added keyboard shortcuts `4`, `5`, `6`, and `7` in `App.tsx` (with input/textarea guard).
  - [x] Extended auto-scene cycler in `App.tsx` to cycle through all 7 scenes.
  - [x] Added 4 new built-in presets in `presets.ts` (`Crystal Matrix`, `Cyber Megalopolis`, `DNA Cyberstrand`, `Plasma Vortex`).
  - [x] Updated `SidePanel.tsx` scene drawer tooltip (`1-7`) and verified dynamic button mapping.
- [x] Testing & Build Verification:
  - [x] Created unit tests for all 4 new scenes (`CrystalLatticeScene.test.ts`, `CyberCityScene.test.ts`, `DNAHelixScene.test.ts`, `PlasmaVortexScene.test.ts`).
  - [x] Updated `SceneManager.test.ts` and `presets.test.ts` to validate 7 scenes and 9 presets.
  - [x] Ran automated test suite: 18 test files, 128 tests passing (100% pass rate).
  - [x] Ran TypeScript type check (`tsc --noEmit`): 0 errors.
  - [x] Ran production build (`vite build`): compiled cleanly in 4.03s.

---

## [x] Checkpoint 10 — Visual Art Direction & Quality Overhaul (Seven-Scene Library)
- [x] Mandatory Step 0: Created physical filesystem backup at `.restore-points/pre-visual-quality-overhaul/`:
  - [x] Backed up complete `src/` directory, `PROJECT_SPEC.md`, `TASKS.md`, `PROGRESS.md`, `BUGS.md`, `README.md`, `package.json`, and `package-lock.json`.
  - [x] Verified full backup presence and file integrity.
- [x] Scene 1: Neon Tunnel Overhaul (`NeonTunnelScene.ts`):
  - [x] Replaced repetitive rings with 24 architectural portal segments alternating between octagonal and hexagonal chamfered bulkheads.
  - [x] Added 4 longitudinal energy conduits, 8 animated chevron guidance beacons, foreground parallax arch, and vanishing singularity core.
  - [x] Refined audio mapping: bass structural dilation, mid conduit propagation, treble neon flares.
- [x] Scene 2: Particle Universe Overhaul (`ParticleUniverseScene.ts`):
  - [x] Replaced undifferentiated particle cloud with 3 distinct astronomical populations:
    - [x] Keplerian Accretion Disk (4,000 particles) with orbital velocity $\propto r^{-1.5}$ in a logarithmic spiral.
    - [x] Braided Toroidal Filaments (2,000 particles) weaving dual counter-twisting orbital streams.
    - [x] Deep-Field Stellar Halo (2,000 particles) for immense depth and parallax.
  - [x] Added dual geodesic pulsar core with counter-rotating wireframe icosahedrons and dynamic point lights.
  - [x] Audio mapping: radial bass shockwaves, mid magnetic flux twisting, treble stellar twinkling.
- [x] Scene 3: Synthwave Horizon Overhaul (`SynthwaveHorizonScene.ts`):
  - [x] Added solid obsidian mountain silhouette bodies with glowing wireframe crest lines.
  - [x] Added high-intensity laser highway with animated dash markings down the center grid.
  - [x] Added 12-band segmented 1980s sunset with atmospheric back-corona disc and dynamic horizon glow.
  - [x] Implemented cinematic hovering camera with gentle lateral sway and bass FOV punch.
- [x] Scene 4: Ferrofluid Singularity (`FerrofluidScene.ts`):
  - [x] Sculptural subdivided icosahedron core with multi-harmonic vertex displacement (bass spikes, mid ripples, treble tension).
  - [x] Equatorial 64-bar instanced spectrum halo and 35°-tilted orbital waveform ribbon.
  - [x] Metallic specular response and zero per-frame heap allocations.
- [x] Scene 5: Voxel Matrix (`VoxelMatrixScene.ts`):
  - [x] 24×24 instanced 3D pin-art architectural field (576 monolithic pillars) viewed from an isometric 35° camera.
  - [x] Radial propagating bass shockwaves lofting pillars into kinetic waves.
  - [x] Reusable matrices, vectors, and colors with zero per-frame allocations.
- [x] Scene 6: Waveform Ridgelines (`WaveformRidgelineScene.ts`):
  - [x] Topographic waterfall spectrogram with 48 chronological audio slices.
  - [x] Gaussian bell-curve shaping, glowing line crests, and black occlusion ribbons beneath each ridge for true spatial depth.
  - [x] Regulated update interval and zero per-frame buffer reallocations.
- [x] Scene 7: Cybernetic Helix (`CyberHelixScene.ts`):
  - [x] Counter-spiraling cylindrical backbone strands with 64 instanced connecting frequency rungs.
  - [x] 600 ambient depth particles and traveling core energy point lights.
  - [x] Axial bass expansion and frequency-responsive rung scaling.
- [x] System Integration & Presets:
  - [x] Registered all 7 official scenes in `SceneManager.ts` and `presets.ts` with backward-compatible legacy alias support.
  - [x] Created 4 tailored presets: `Ferrofluid Singularity`, `Voxel Pin Matrix`, `Waveform Ridgelines`, `Cybernetic Helix`.
  - [x] Updated `App.tsx` keyboard shortcuts 1–7 and auto-cycler array.
- [x] Testing & Quality Verification:
  - [x] Created unit tests for all scenes (`FerrofluidScene.test.ts`, `VoxelMatrixScene.test.ts`, `WaveformRidgelineScene.test.ts`, `CyberHelixScene.test.ts`).
  - [x] All 22 test files and 152 tests passing (100% pass rate).
  - [x] TypeScript compiler (`tsc --noEmit`): 0 errors.
  - [x] Production build (`vite build`): compiled cleanly in 3.88s.

---

## [x] Checkpoint 10A — Targeted Visual Redesign (Scene 5 & Scene 7)
- [x] Mandatory Step 0: Created physical backup at `.restore-points/pre-scene-5-7-redesign/`:
  - [x] Backed up complete `src/` directory, `PROJECT_SPEC.md`, `TASKS.md`, `PROGRESS.md`, `BUGS.md`, `README.md`, `package.json`, and `package-lock.json`.
  - [x] Verified full backup presence (86 items) and file integrity without touching previous restore points.
- [x] Scene 5: Voxel Matrix Redesign — "Obsidian Kinetic City" (`VoxelMatrixScene.ts`):
  - [x] Implemented dual-tier monolith architecture: 576 precision-engineered obsidian pillar bodies (`metalness: 0.82`, `roughness: 0.22`) paired with synchronized luminous emitter caps.
  - [x] Added subterranean circuit channels and dark foundation platform.
  - [x] Designed precomputed architectural skyline at idle (central grand boulevard, concentric plazas, and perimeter terrace steps).
  - [x] Deliberate audio mapping:
    - [x] Bass: Outward-propagating kinetic shockwaves with beat pulse compression.
    - [x] Mids: Rolling topographical wave swells across harmonic quadrant formations.
    - [x] Treble: Luminous cap activation, edge glints, and beacon bursts without flashing dark bodies.
    - [x] FFT: Spatial organization from central avenues (lows) to outer perimeter sectors (highs).
  - [x] Camera: Elevated 36° isometric perspective with subtle lateral drift and zero per-frame heap allocations.
- [x] Scene 7: Cybernetic Helix Redesign — "Spectral Braid — The Cybernetic Reactor" (`CyberHelixScene.ts`):
  - [x] Framed with dramatic oblique diagonal 3D viewport composition for genuine perspective depth.
  - [x] Implemented continuous articulated structural strands: 160 obsidian capsule nodes (80 per strand) with specular metallic response.
  - [x] Implemented continuous braided optical filaments wrapping the backbone strands in luminous micro-spirals.
  - [x] 64 instanced precision-engineered frequency rungs bridging Strand A to Strand B.
  - [x] Signature Feature: Dual smoothly traveling energy wave fronts ($P_1, P_2$) racing along the reactor axis; as energy fronts pass, adjacent strand nodes and rungs dilate and flare into incandescent neon with Gaussian falloff.
  - [x] Replaced random glitter with 420 disciplined magnetic containment streamline particles in helical orbits.
  - [x] Deliberate audio mapping: bass structural tension and pulse expansion; mid harmonic twisting waves; treble braided filament glints; smooth FFT rung frequency progression.
- [x] Testing & Build Verification:
  - [x] Unit tests for both redesigned scenes pass 100% (`VoxelMatrixScene.test.ts`, `CyberHelixScene.test.ts`).
  - [x] Full test suite: 22 test files, 152 tests passing (100% pass rate).
  - [x] TypeScript compiler (`tsc --noEmit`): 0 errors.
  - [x] Production build (`vite build`): compiled cleanly in 3.45s with 0 errors.




