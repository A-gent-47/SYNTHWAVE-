# 🌌 SYNTHWAVE — Immersive Real-Time 3D Music Visualizer

A real-time, privacy-first 3D audio-reactive music visualizer built with **React**, **TypeScript**, **Three.js**, and the **Web Audio API**.

---

## 📸 Screenshots & Demos

<!-- Replace placeholders with actual preview screenshots or GIFs of the visualizer scenes -->
| Neon Tunnel | Celestial Nebula | Synthwave Horizon |
| :---: | :---: | :---: |
| ![Neon Tunnel Preview](https://via.placeholder.com/400x225/0a0614/00f0ff?text=Neon+Tunnel) | ![Celestial Nebula Preview](https://via.placeholder.com/400x225/0a0614/7928ca?text=Celestial+Nebula) | ![Synthwave Horizon Preview](https://via.placeholder.com/400x225/0a0614/ff5500?text=Synthwave+Horizon) |

| Ferrofluid Singularity | Voxel Matrix | Waveform Ridgelines |
| :---: | :---: | :---: |
| ![Ferrofluid Preview](https://via.placeholder.com/400x225/0a0614/bd00ff?text=Ferrofluid) | ![Voxel Matrix Preview](https://via.placeholder.com/400x225/0a0614/00f0ff?text=Voxel+Matrix) | ![Waveform Ridgelines Preview](https://via.placeholder.com/400x225/0a0614/ff0077?text=Waveform+Ridgelines) |

---

## 🎧 Overview

**SYNTHWAVE** transforms your local audio files into reactive 3D environments rendered in real time via WebGL. Load any audio file from your device and watch custom Three.js geometries deform, pulse, and animate in synchronization with the actual frequency spectrum of your track.

- **100% Client-Side & Private**: Runs entirely in the browser. No audio data or telemetry is sent to any external server.
- **Hardware-Accelerated Audio DSP**: Utilizes the native Web Audio API `AnalyserNode` for Fast Fourier Transform (FFT) frequency analysis.
- **Zero API Keys Required**: Does not rely on any paid third-party APIs or cloud subscriptions.

---

## ✨ Features

### 1. Six Distinct 3D Visualization Environments
1. **Neon Tunnel (`1`)**: Architectural hyperspace conduit featuring 24 modular portal segments alternating between octagonal and hexagonal bulkheads, longitudinal energy conduits, animated chevron beacons, and a vanishing-point singularity core.
2. **Particle Universe (`2`)**: Tri-tier astronomical generative universe comprising a Keplerian accretion disk ($r^{-1.5}$ orbital velocity), dual braided toroidal filaments, a deep-field stellar halo, and a dual-geodesic pulsar core.
3. **Synthwave Horizon (`3`)**: Cinematic retro-futuristic horizon featuring solid obsidian mountain silhouettes with glowing wireframe crest lines, a central laser highway with animated markings, and a segmented sunset with an atmospheric corona disc.
4. **Ferrofluid Singularity (`4`)**: Metallic magnetic fluid singularity with multi-harmonic vertex displacement, an equatorial 64-bar instanced spectrum halo, and an orbital 35°-tilted waveform ribbon.
5. **Voxel Matrix (`5`)**: Architectural 3D field of 576 kinetic monoliths with metallic satin bodies, synchronized luminous emitter caps, subterranean circuit channels, radial bass shockwaves, and rolling topographical swells.
6. **Waveform Ridgelines (`6`)**: Topographic waterfall spectrogram of 48 chronological audio slices with Gaussian bell-curve shaping, glowing line crests, and black occlusion ribbons for true spatial depth.

### 2. Audio Processing & DSP Engine
- **Band Extraction**: Extracts Sub-Bass, Bass (20 Hz – 250 Hz), Mids (250 Hz – 2,500 Hz), and Treble (2,500 Hz – 16,000 Hz).
- **Dynamic Lerp Smoothing**: Dual-rate attack/release smoothing preventing frame-to-frame jitter while preserving percussive transient punch.
- **Beat Pulse Detection**: Real-time energy threshold detection triggering instantaneous geometric shockwaves and camera thumps.

### 3. Complete Music Library & Playlist Manager
- **Local Audio Import**: Drag-and-drop or file-picker upload for `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, and `.webm`.
- **Deduplication**: Deterministic fingerprinting (`name:size:lastModified`) prevents duplicate track imports.
- **Custom Playlists**: Create, rename, clear, and delete playlists with non-destructive track referencing.
- **Playback Queue**: Slide-out drawer with track reordering and individual track removal.
- **Search & Filter**: Real-time filtering by track title, artist, or album, with sorting and Favorites tagging.
- **Local Persistence**: Library metadata, playlists, and settings persist safely across sessions in `localStorage`.

### 4. Customization & Preset System
- **Built-in Presets**: Curated style presets (Cyberpunk Neon, Deep Space, Electric Violet, Retro Sunset, Monochrome Voltage, etc.).
- **Tuning Sliders**: Frequency band multipliers (Bass, Mid, Treble), motion speed, bloom intensity, particle density, and camera shake.
- **Reduced Effects Mode**: Performance toggle disabling heavy post-effects and wireframes on low-power devices.
- **JSON Import / Export**: Export and import custom visualizer configurations.

---

## 🛠️ Technologies Used

| Technology | Role | Purpose |
| :--- | :--- | :--- |
| **React 18** | UI Framework | Component architecture, modals, drawers, and reactive HUD controls |
| **TypeScript 5** | Language | Type safety for audio metrics, Three.js lifecycles, and preset schemas |
| **Three.js** | 3D Engine | WebGL rendering, custom geometries, instanced meshes, lighting, and GPU disposal |
| **Web Audio API** | Audio DSP | Real-time FFT analysis (`AnalyserNode`), waveform extraction, and stereo routing |
| **Zustand 5** | State Management | High-performance state stores for audio and visualizer state without React re-render thrashing |
| **Vite 5** | Build Tool | Development server with instant HMR and optimized production bundling |
| **Vitest** | Testing Suite | Fast unit and integration testing for DSP math, stores, and scene contracts |
| **Lucide React** | Iconography | Lightweight cybernetic icons for media controls and drawer navigation |
| **CSS Modules** | Styling | Isolated, zero-runtime overhead neon styling |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18+` or `v20+` (Recommended: `v20` LTS or higher)
- **npm**: `v9+` or `v10+`
- **Modern Browser**: Chrome, Edge, Brave, Firefox, or Safari with WebGL enabled.

### Installation
Clone or download the repository to your local machine:

```bash
cd synthwave
```

Install project dependencies:

```bash
# On Linux / macOS:
npm install

# On Windows PowerShell (uses npm.cmd):
npm.cmd install
```

### Running Locally
Start the local development server:

```bash
# On Linux / macOS:
npm run dev

# On Windows PowerShell:
npm.cmd run dev
```

Once running, navigate to `http://localhost:5173/` in your browser.

### Running Tests
Execute the automated Vitest test suite:

```bash
# On Linux / macOS:
npm test

# On Windows PowerShell:
npm.cmd test
```

### Building for Production
Create an optimized production bundle in the `dist/` directory:

```bash
# On Linux / macOS:
npm run build

# On Windows PowerShell:
npm.cmd run build
```

To preview the production build locally:

```bash
npm run preview
# On Windows PowerShell:
npm.cmd run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause Audio |
| `N` | Next Track in Queue |
| `B` | Previous Track in Queue |
| `S` | Toggle Shuffle Mode |
| `L` | Open / Close Music Library Modal |
| `Q` | Open / Close Playback Queue Drawer |
| `M` | Mute / Unmute Audio |
| `F` | Toggle Fullscreen Mode |
| `H` | Toggle HUD Visibility (Distraction-Free Immersion) |
| `1` | Switch to **Neon Tunnel** |
| `2` | Switch to **Particle Universe** |
| `3` | Switch to **Synthwave Horizon** |
| `4` | Switch to **Ferrofluid Singularity** |
| `5` | Switch to **Voxel Matrix** |
| `6` | Switch to **Waveform Ridgelines** |
| `P` | Pause / Freeze 3D Visual Animation (Audio continues) |
| `R` | Reset Controls & Presets to Factory Defaults |
| `←` / `→` | Seek backward / forward 5 seconds |

---

## 📂 Project Structure

```text
synthwave/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (tests & build)
├── docs/                      # Technical design documents and project history
│   ├── BUGS.md
│   ├── PROGRESS.md
│   ├── PROJECT_SPEC.md
│   └── TASKS.md
├── src/
│   ├── audio/                 # AudioEngine, FFT band analysis, DSP math
│   ├── components/            # UI components (AudioPlayer, SidePanel, Viewport, etc.)
│   ├── store/                 # Zustand stores (audioStore, playlistStore, visualizerStore)
│   ├── utils/                 # Audio utilities, metadata extraction, hashing
│   ├── visualizer/            # Three.js core, SceneManager, presets, and scene implementations
│   │   └── scenes/            # Individual 3D visualizer scenes
│   ├── App.tsx                # Application root with keyboard listener
│   └── main.tsx               # React DOM entry point
├── .gitattributes             # Line ending normalization
├── .gitignore                 # Files excluded from git tracking
├── CONTRIBUTING.md            # Contribution guidelines
├── index.html                 # HTML shell
├── package.json               # Package dependencies & build scripts
├── README.md                  # Project documentation
├── tsconfig.json              # TypeScript compilation configuration
└── vite.config.ts             # Vite build & Vitest test configuration
```

---

## 📖 Additional Documentation

Detailed technical documents are maintained in the [`docs/`](./docs) folder:
- [Technical Project Specification](./docs/PROJECT_SPEC.md)
- [Development Progress Log](./docs/PROGRESS.md)
- [Completed Engineering Tasks](./docs/TASKS.md)
- [Bug Tracking & Resolutions](./docs/BUGS.md)

---

## 🛠️ Troubleshooting

- **Audio does not play on page load:**
  Browsers require a user gesture before starting the Web Audio context. Click anywhere on the screen or press the Play button to unlock the audio pipeline.
- **"FILE OFFLINE (RESELECT)" indicator after refresh:**
  For security and privacy, browsers revoke temporary in-memory Object URLs upon page reload. Click the "RELINK" button on any offline track to re-select the file.
- **Windows PowerShell execution policy error:**
  If PowerShell blocks executing `.ps1` scripts, run commands using `npm.cmd` instead of `npm`.
- **Performance / Framerate Optimization:**
  Open the settings panel and enable **Reduced Effects Mode**, or reduce particle density. Ensure hardware acceleration is enabled in your browser.
