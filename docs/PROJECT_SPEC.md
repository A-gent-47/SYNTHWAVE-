# PROJECT SPECIFICATION: SYNTHWAVE — Immersive Music Visualizer

## 1. Executive Summary
**SYNTHWAVE** is a modern, client-side, real-time 3D music visualization web application built with React, TypeScript, Three.js, and the Web Audio API. It transforms user-imported local audio files into reactive 3D environments rendered via WebGL. 

The application is completely privacy-first and runs 100% locally in the browser—no server uploads, no paid API keys, and no telemetry.

---

## 2. Target Aesthetic & Design Direction
- **Theme**: Futuristic Cyberpunk / Retro-Futuristic Synthwave Studio.
- **Palette**:
  - Backgrounds: Deep space blacks (`#050508`), midnight purples (`#0a0614`), obsidian gray (`#12111a`).
  - Accents: Neon cyan (`#00f0ff`), electric violet (`#8b00ff`), hot magenta (`#ff007f`), glowing amber (`#ffaa00`).
- **Visual Effects**:
  - Bloom-like luminous glows, atmospheric fog, emissive wireframes, reactive lighting, and motion blur/trails.
- **UI Feel**:
  - High-precision cybernetic HUD with restrained micro-animations.
  - Zero clutter: clean typography (Inter / Orbitron / Space Grotesk vibes), intuitive controls, and a dedicated distraction-free fullscreen visualization mode.
  - Avoids tacky, generic AI card templates or sluggish heavy blur filters.

---

## 3. Technology Stack & Architectural Decisions

### 3.1 Core Technologies
| Technology | Role | Justification |
| :--- | :--- | :--- |
| **Node.js 24 + Vite** | Build Tool & Bundler | Instant HMR, lightning-fast dev builds, lightweight bundling for TypeScript & React. |
| **React 19 / 18 + TypeScript** | UI Architecture & Type Safety | Modular UI components, strict typing for audio and rendering states, clean lifecycle hooks. |
| **Three.js** | 3D Graphics Engine | Industry-standard WebGL engine providing direct, high-performance control over shaders, geometries, materials, particles, and resource disposal without unnecessary abstraction overhead. |
| **Web Audio API** | Real-time DSP & Audio Pipeline | Hardware-accelerated FFT frequency analysis (`AnalyserNode`), gain control, time-domain waveform extraction, and stereo audio routing. |
| **Zustand** | State Management | Lightweight, performant state store with minimal boilerplate. Does not trigger unnecessary React component re-renders during high-frequency audio updates. |
| **Vanilla CSS / CSS Modules** | Styling System | Tailored neon design tokens, zero build-step overhead, guaranteed isolation, buttery smooth 60fps transitions. |
| **Vitest + Testing Library** | Unit & Integration Testing | Fast native Vite test runner for testing audio mathematics, preset serialization, and UI state changes. |

### 3.2 Architectural Modules
```
                    ┌────────────────────────┐
                    │      Audio Source      │
                    │   (Local File / Blob)  │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │      AudioEngine       │
                    │ (Web Audio Analyser)   │
                    │  - FFT (1024 bins)     │
                    │  - Band Extraction     │
                    │  - Lerp Smoothing      │
                    └───────────┬────────────┘
                                │ AudioMetrics
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                       VisualizerCore                        │
 │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  │
 │  │   TunnelScene   │  │  ParticleScene   │  │HorizonScene│  │
 │  └────────┬────────┘  └────────┬─────────┘  └─────┬──────┘  │
 │           └────────────────────┼──────────────────┘         │
 │                                ▼                            │
 │                        Three.js Engine                      │
 │                   (Single RAF / WebGLCanvas)                │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      React UI & HUD                         │
 │  - Audio Player Bar (Play, Scrubber, Volume)                │
 │  - Customization Panel (Sensitivities, Colors, Scales)      │
 │  - Preset Selector & LocalStorage Manager                   │
 │  - Fullscreen & Minimal HUD Mode                            │
 └─────────────────────────────────────────────────────────────┘
```

---

## 4. Audio Analysis Engine Specifications

### 4.1 Frequency Band Separation
The Web Audio `AnalyserNode` provides frequency domain data via `getByteFrequencyData` (0–255). SYNTHWAVE extracts and normalizes three primary frequency bands:
1. **Bass (Sub & Lows: 20 Hz – 250 Hz)**:
   - Powers geometry scale, tunnel ring dilation, terrain displacement, shockwave pulses, camera thumps.
2. **Mids (Vocals & Instruments: 250 Hz – 2,500 Hz)**:
   - Powers surface ripple effects, particle turbulence, terrain wave velocity, wireframe brightness.
3. **Treble (Highs & Percussion: 2,500 Hz – 16,000 Hz)**:
   - Powers starfield scintillation, micro-particle emission, lightning/grid flash, camera chromatic flare.

### 4.2 Temporal Smoothing & Dynamic Range Compression
- Raw FFT samples cause harsh frame-to-frame flickering.
- We implement dynamic smoothing:
  $$\text{Value}_t = \text{Value}_{t-1} + (\text{Raw}_t - \text{Value}_{t-1}) \times \alpha$$
  where $\alpha$ is dynamic (faster attack $\approx 0.4$, slower release $\approx 0.15$) to produce snappy yet fluid visual reactions.
- Peak tracking and dynamic gain normalization prevent quiet tracks from looking dead or loud master tracks from clipping all visual channels.

---

## 5. Seven Distinct 3D Visualization Scenes (Official Checkpoint 10 Library)

### Scene 1: Neon Tunnel ("Hyperspace Conduit", Key: 1)
- **Visuals**: Architectural hyperspace corridor featuring 24 modular portal segments. Alternates between octagonal and hexagonal bulkheads with outer chamfered frames and inner structural rings. Flanked by 4 longitudinal energy conduits, 8 animated chevron guidance beacons, a high-detail foreground parallax arch, and a vanishing-point singularity core.
- **Audio Reactions**:
  - Bass drives structural portal depth dilation, traveling expansion waves, and a subtle camera FOV punch.
  - Mids drive conduit pulsation, chevron beacon traveling wave propagation, and inner ring rotations.
  - Treble sparks trigger high-frequency conduit light flares and chevron neon surges.

### Scene 2: Particle Universe ("Celestial Nebula", Key: 2)
- **Visuals**: A tri-tier astronomical generative system comprising:
  1. *Keplerian Accretion Disk* (4,000 particles) orbiting with differential velocities ($\propto r^{-1.5}$) in a glowing logarithmic spiral.
  2. *Braided Toroidal Filaments* (2,000 particles) weaving dual counter-twisting orbital streams.
  3. *Deep-Field Stellar Halo* (2,000 particles) providing immense celestial scale and parallax.
  4. *Dual Geodesic Pulsar Core* with counter-rotating wireframe icosahedrons and dynamic point lights.
- **Audio Reactions**:
  - Bass drops trigger outward spherical shockwaves that compress and re-gravitate into the core.
  - Mids modulate toroidal braid oscillation, orbital velocity, and magnetic flux twisting.
  - Treble drives stellar halo twinkle, scintillation, and core point-light surges.

### Scene 3: Synthwave Horizon ("Retro Grid & Sunset", Key: 3)
- **Visuals**: A cinematic retro-futuristic horizon featuring:
  - Solid obsidian mountain silhouettes with glowing wireframe crest lines flanking the vista.
  - Endless retro floor grid with a central high-intensity laser highway and animated dash markings.
  - Segmented 1980s sunset with 12 horizontal bands, back-corona atmospheric disc, and dynamic horizon glow.
  - Hovering camera with gentle cinematic sway and audio-reactive horizon breathing.
- **Audio Reactions**:
  - Bass pumps the laser highway illumination, mountain crest height modulation, and subtle horizon compression.
  - Mids drive floor grid wave ripples and road dash progression speed.
  - Treble modulates sunset corona flares, horizon glow intensity, and starfield twinkling.

### Scene 4: Ferrofluid Singularity ("Ferrofluid Singularity", Key: 4)
- **Visuals**: A dark metallic magnetic fluid core deformed by multi-scale surface harmonics. Surrounded by an equatorial 64-bar instanced spectrum halo and an orbital waveform ribbon tilted at 35°.
- **Audio Reactions**:
  - Bass drives primary radial spike elongation and core volume respiration.
  - Mids drive secondary traveling surface tension ripples.
  - Treble drives subtle high-frequency surface shimmer and halo glow.
  - Frequency bins map directly to the equatorial bar halo and waveform ribbon.

### Scene 5: Voxel Matrix ("Obsidian Kinetic City", Key: 5)
- **Visuals**: A cinematic 24×24 architectural field of precision-engineered obsidian monoliths (576 instances) with synchronized luminous emitter caps and subterranean circuit channels. Rendered with dark metallic satin response (`metalness: 0.82`, `roughness: 0.22`) and viewed from an elevated 36° isometric vantage point. Features a precomputed architectural skyline at idle (central grand boulevard, concentric plazas, and perimeter terrace steps).
- **Audio Reactions**:
  - Bass drives outward propagating kinetic shockwaves that loft monoliths into continuous fluid ripples, with beat pulse compression.
  - Mids modulate rolling topographical swells and harmonic quadrant waves across city sectors.
  - Treble activates the luminous emitter caps with accent beacon bursts, selective color transitions, and edge glints without flashing the dark obsidian bodies.
  - Spatial FFT organization: low frequency bins drive central towers; mid frequencies drive intermediate city blocks; high frequencies activate outer perimeter beacons.

### Scene 6: Waveform Ridgelines ("Waveform Ridgelines", Key: 6)
- **Visuals**: A topographic waterfall spectrogram displaying 48 consecutive chronological audio slices. Features Gaussian bell-curve edge tapering, glowing ridge line crests, and black occlusion ribbons beneath each ridge for true spatial depth.
- **Audio Reactions**:
  - Audio FFT bins directly shape the leading front ridge across bass, mids, and treble.
  - Historical frequency rows cascade backward along the waterfall with regulated delta timing.
  - Treble and bass drive line glow and occlusion ribbon contrast.

### Scene 7: Cybernetic Helix ("Spectral Braid — The Cybernetic Reactor", Key: 7)
- **Visuals**: A sophisticated kinetic double-helix reactor composed of 160 articulated obsidian strand nodes (80 per strand), continuous braided luminous optical filaments wrapping the backbone in micro-spirals, 64 instanced precision-engineered frequency rungs, and 420 magnetic containment streamline particles. Framed with an oblique diagonal 3D viewport composition for dramatic perspective depth.
- **Audio Reactions**:
  - Signature Feature: Dual smoothly traveling energy wave fronts ($P_1, P_2$) racing along the reactor axis; as energy fronts pass each coordinate, adjacent strand nodes and rungs dilate in thickness, flaring into incandescent neon with localized Gaussian falloff.
  - Bass drives structural tension, expands overall helix radius, and launches high-amplitude shock pulses down the reactor.
  - Mids drive progressive harmonic twisting waves along the strands and regional rung dilation.
  - Treble activates high-frequency shimmering across the braided filaments, rung collar glints, and particle velocity surges.
  - Frequency bins map smoothly along the longitudinal rung sequence from deep bass to treble.

---

## 6. Controls, Customization & Presets

### 6.1 Customization Controls
- **Bands Sensitivity**: Bass, Mid, Treble multiplier sliders (0.1x to 3.0x).
- **Motion & Camera**: Motion speed, Camera Shake intensity (with safe disable option), Orbit/Follow mode.
- **Visual Parameters**: Particle Density (Low/Med/High), Glow/Bloom emulation intensity, Color Palette selector.
- **Scene Switching**: Manual toggle or Auto-transition mode (every 30s/60s).
- **Animation Freeze**: Pause visuals independently of audio playback for inspection.

### 6.2 Curated Built-in Presets
1. **Cyberpunk Neon**: Cyan `#00f0ff` & Magenta `#ff007f`, high contrast, reactive bloom (Neon Tunnel).
2. **Deep Space**: Obsidian `#050508`, Ice Blue `#00d4ff`, and Violet `#7928ca` with expansive particle fields (Particle Universe).
3. **Electric Violet**: Deep Purple `#0a0414`, Neon Violet `#bd00ff`, and Emerald `#00ff88` (Neon Tunnel).
4. **Retro Sunset**: Sunset Orange `#ff5500`, Neon Pink `#ff0077`, and Golden Yellow `#ffcc00` (Synthwave Horizon).
5. **Monochrome Voltage**: High-contrast Silver `#e0e0e0`, Pearl White `#ffffff`, and Charcoal `#080808` (Particle Universe).
6. **Crystal Matrix**: Deep Space palette with crystal lattice expansion and subtle camera shake (Crystal Lattice).
7. **Cyber Megalopolis**: High-energy Cyberpunk neon drive through reactive skyscrapers (Cyber City).
8. **DNA Cyberstrand**: Electric Violet palette highlighting pulsing double-helix strands and rungs (DNA Helix).
9. **Plasma Vortex**: Retro Sunset palette driving high-energy vortex eruptions and lightning arcs (Plasma Vortex).
10. **Custom User Presets**: Stored in `localStorage` with JSON import/export/deletion.

---

## 7. Performance Targets & Optimization Strategy
- **Target Frame Rate**: Smooth 60 FPS on standard modern laptop GPUs (Intel Iris Xe / Apple M1 / GTX 1650).
- **Techniques**:
  1. **Cap Device Pixel Ratio**: Cap `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` to avoid rendering 4K buffers on high-DPI laptops.
  2. **Geometry & Material Reuse**: Zero instantiation of meshes/geometries in the animation loop.
  3. **Direct Buffer Updates**: In-place attribute buffer updates (`position.needsUpdate = true`) for reactive meshes.
  4. **Strict Resource Disposal**: Explicit traversal and disposal of geometries, materials, and WebGL textures on scene switches.
  5. **Reduced Effects Mode**: Option to halve particle counts and disable heavy post-processing for low-power hardware.

---

## 8. Keyboard Shortcuts
- `Space`: Play / Pause audio.
- `M`: Toggle Mute.
- `F`: Toggle Fullscreen visualization mode.
- `H`: Toggle HUD / UI visibility (Clean immersion mode).
- `1` – `7`: Switch directly to Scenes 1 through 7:
  - `1`: Neon Tunnel
  - `2`: Celestial Nebula (Particle Universe)
  - `3`: Synthwave Horizon
  - `4`: Crystal Lattice
  - `5`: Cyber City
  - `6`: DNA Helix
  - `7`: Plasma Vortex
- `R`: Reset camera / visual parameters to default.
- `Left` / `Right`: Seek backward / forward 5 seconds.
- `L`: Open / Close Music Library and Playlists.
- `Q`: Open / Close Playback Queue Drawer.
- `N`: Next track in queue.
- `B` / `P`: Previous track in queue.
- `S`: Toggle Shuffle mode.

---

## 9. Playlist & Music Library Architecture

### 9.1 Overview & Privacy-First Persistence
The Playlist & Music Library architecture extends the core audio player with multi-playlist management, queue progression, track search, sorting, favourites, and safe browser-local metadata persistence.

- **Client-Side Privacy Guarantee**:
  - 100% local operation—no file uploads to remote servers.
  - Large binary blobs are never persisted in `localStorage`.
  - Stored metadata is strictly structured JSON containing track identifiers, titles, artists, albums, durations, playlist associations, and playback preferences.
- **Unavailable File Handling**:
  - Because browser security policies revoke temporary Object URLs upon session termination or page reload, offline tracks are flagged with an intuitive `FILE OFFLINE` indicator and 1-click file reselection dialog without losing playlist positions or custom tags.
  - Built-in Synthwave demo tracks are procedurally regenerated on demand and remain instantly playable across all sessions.

### 9.2 Key Subsystems
1. **Playlist Engine (`playlistStore.ts`)**:
   - Create, rename, delete, and clear playlists.
   - Non-destructive deletion: deleting a playlist never removes original audio files from the library.
   - Deterministic track fingerprinting (`FNV-1a` hash over file name, size, and modification timestamp) prevents accidental library duplicates while allowing the same song in multiple playlists.
2. **Playback Queue & Navigation**:
   - Non-repeating Fisher-Yates shuffle algorithm preserving active track position.
   - Three repeat modes: `off`, `all` (loop entire playlist), and `one` (loop single track).
   - Dedicated slide-out Queue Drawer with drag/accessible reordering, removal, and clear queue.
3. **Music Library & Metadata**:
   - Automatic metadata heuristics extracting Artist, Title, and Album from filenames.
   - Real-time search across Title, Artist, and Album.
   - Multi-field sorting (Title, Artist, Album, Duration, Date Added) with asc/desc order toggle.
   - Starred Favourites view.
4. **Visualizer Continuity**:
   - Feeds the identical active HTML5 Audio Element into the Web Audio `AudioEngine` singleton without disconnecting the `AnalyserNode` or generating conflicting audio graphs.

