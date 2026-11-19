import * as THREE from 'three';
import { AudioMetrics } from '../../audio/types';
import { ColorPalette } from '../presets';

export interface VisualizerScene {
  id: string;
  name: string;
  init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void;
  update(elapsedTime: number, deltaTime: number, metrics: AudioMetrics): void;
  resize(width: number, height: number): void;
  dispose(): void;
  applyPalette?(palette: ColorPalette): void;
}
