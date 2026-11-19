import { VisualizerScene } from './scenes/SceneBase';
import { NeonTunnelScene } from './scenes/NeonTunnelScene';
import { ParticleUniverseScene } from './scenes/ParticleUniverseScene';
import { SynthwaveHorizonScene } from './scenes/SynthwaveHorizonScene';
import { FerrofluidScene } from './scenes/FerrofluidScene';
import { VoxelMatrixScene } from './scenes/VoxelMatrixScene';
import { WaveformRidgelineScene } from './scenes/WaveformRidgelineScene';

export interface SceneDescriptor {
  id: string;
  shortcut: string;
  name: string;
  title: string;
  description: string;
}

export const AVAILABLE_SCENES: SceneDescriptor[] = [
  {
    id: 'neon-tunnel',
    shortcut: '1',
    name: '01 // NEON TUNNEL',
    title: 'Hyperspace Conduit',
    description: 'Deep architectural futuristic tunnel with alternating bulkheads, longitudinal energy conduits, and vanishing core.'
  },
  {
    id: 'particle-universe',
    shortcut: '2',
    name: '02 // CELESTIAL NEBULA',
    title: 'Celestial Nebula',
    description: 'Layered particle galaxy with Keplerian accretion disk, braided toroidal filaments, and pulsar shockwave dynamics.'
  },
  {
    id: 'synthwave-horizon',
    shortcut: '3',
    name: '03 // SYNTHWAVE HORIZON',
    title: 'Retro Grid & Sunset',
    description: 'Retro-futuristic landscape with layered solid mountain ridges, central laser highway, and segmented horizon sun.'
  },
  {
    id: 'ferrofluid',
    shortcut: '4',
    name: '04 // FERROFLUID',
    title: 'Ferrofluid Singularity',
    description: 'Sculptural metallic liquid core with multi-harmonic vertex displacement, 64-bar spectrum halo, and waveform ribbon.'
  },
  {
    id: 'voxel-matrix',
    shortcut: '5',
    name: '05 // VOXEL MATRIX',
    title: 'Kinetic Voxel Grid',
    description: 'Precise 3D architectural pin-art grid with radial bass shockwaves, dynamic height scaling, and isometric perspective.'
  },
  {
    id: 'waveform-ridgelines',
    shortcut: '6',
    name: '06 // RIDGELINES',
    title: 'Waveform Ridgelines',
    description: 'Topographic waterfall spectrogram of 48 glowing ridgelines with Gaussian bell-curve shaping and occlusion depth.'
  }
];

export class SceneManager {
  public static createScene(id: string): VisualizerScene {
    switch (id) {
      case 'particle-universe':
        return new ParticleUniverseScene();
      case 'synthwave-horizon':
        return new SynthwaveHorizonScene();
      case 'ferrofluid':
      case 'crystal-lattice':
        return new FerrofluidScene();
      case 'voxel-matrix':
      case 'cyber-city':
        return new VoxelMatrixScene();
      case 'waveform-ridgelines':
      case 'plasma-vortex':
        return new WaveformRidgelineScene();
      case 'neon-tunnel':
      default:
        return new NeonTunnelScene();
    }
  }

  public static getSceneDescriptor(id: string): SceneDescriptor {
    const desc = AVAILABLE_SCENES.find((s) => s.id === id);
    return desc || AVAILABLE_SCENES[0];
  }
}
