import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioMetrics } from '../audio/types';
import { VisualizerScene } from './scenes/SceneBase';
import { NeonTunnelScene } from './scenes/NeonTunnelScene';
import { SceneManager } from './SceneManager';
import { useVisualizerStore } from '../store/visualizerStore';
import { COLOR_PALETTES, ColorPaletteId } from './presets';

export class VisualizerCore {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isDisposed = false;
  private isContextLost = false;

  // Active 3D Scene
  private activeScene: VisualizerScene | null = null;

  // Audio Engine reference
  private audioEngine: AudioEngine;

  // Animation clock and continuous accumulator
  private clock = new THREE.Clock();
  private accumulatedTime = 0;

  // Cached settings
  private currentPaletteId: ColorPaletteId | null = null;

  // Metrics callback for UI overlays
  private onMetricsUpdate?: (metrics: AudioMetrics) => void;

  constructor(
    container: HTMLElement,
    onMetricsUpdate?: (metrics: AudioMetrics) => void
  ) {
    this.container = container;
    this.onMetricsUpdate = onMetricsUpdate;
    this.audioEngine = AudioEngine.getInstance();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 0);

    // 3. WebGLRenderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    // Cap pixel ratio to 1.75 to protect GPU performance on 4K/high-DPI screens
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    const domElement = this.renderer.domElement;
    container.appendChild(domElement);

    // WebGL Context Lost & Restored Event Handlers
    domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
    domElement.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    // 4. Initialize default scene (Neon Tunnel)
    this.loadScene(new NeonTunnelScene());

    // 5. Start animation loop
    this.animate();
  }

  /**
   * Gracefully handles WebGL context loss (GPU reset, power saving, sleep).
   */
  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.isContextLost = true;
    console.warn('WebGL context lost. Pausing render loop awaiting GPU restoration.');
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };

  /**
   * Gracefully re-initializes scene geometries & materials after GPU context is restored.
   */
  private handleContextRestored = (): void => {
    console.info('WebGL context restored. Re-initializing scene and GPU resources.');
    this.isContextLost = false;
    if (this.isDisposed) return;

    const currentSceneId = this.getActiveSceneId() || 'neon-tunnel';
    this.switchScene(currentSceneId);
    this.animate();
  };

  /**
   * Loads and transitions to a visualizer scene.
   */
  public loadScene(scene: VisualizerScene): void {
    if (this.activeScene) {
      this.activeScene.dispose();
      // Clear remaining scene children
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }

    this.activeScene = scene;
    this.activeScene.init(this.scene, this.camera);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.activeScene.resize(width, height);

    // Apply active color palette to newly loaded scene
    const activePalette = useVisualizerStore.getState().paletteId;
    this.currentPaletteId = activePalette;
    if (this.activeScene.applyPalette && COLOR_PALETTES[activePalette]) {
      this.activeScene.applyPalette(COLOR_PALETTES[activePalette]);
    }
  }

  /**
   * Switches to a scene by its identifier.
   */
  public switchScene(sceneId: string): void {
    if (this.activeScene && this.activeScene.id === sceneId) return;
    const nextScene = SceneManager.createScene(sceneId);
    this.loadScene(nextScene);
  }

  /**
   * Resizes renderer and camera projection matrix.
   */
  public resize(width: number, height: number): void {
    if (this.isDisposed || !this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.activeScene) {
      this.activeScene.resize(width, height);
    }
  }

  /**
   * Animation Frame Loop (60 FPS)
   */
  private animate = (): void => {
    if (this.isDisposed || this.isContextLost) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const rawDelta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to avoid jumps on tab switch
    const metrics = this.audioEngine.getMetrics();

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(metrics);
    }

    // Read current visualizer configuration
    const {
      isAnimationPaused,
      motionSpeed,
      bloomIntensity,
      paletteId,
      reducedEffects
    } = useVisualizerStore.getState();

    // Check for dynamic palette changes
    if (paletteId !== this.currentPaletteId) {
      this.currentPaletteId = paletteId;
      if (this.activeScene?.applyPalette && COLOR_PALETTES[paletteId]) {
        this.activeScene.applyPalette(COLOR_PALETTES[paletteId]);
      }
    }

    // Dynamic exposure / bloom scaling
    this.renderer.toneMappingExposure = 1.2 * bloomIntensity;

    // Power-saving DPR scaling for Reduced Effects mode
    const targetPixelRatio = reducedEffects ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.75);
    if (this.renderer.getPixelRatio() !== targetPixelRatio) {
      this.renderer.setPixelRatio(targetPixelRatio);
    }

    // Delegate update to active scene if not paused
    if (!isAnimationPaused) {
      const scaledDelta = rawDelta * motionSpeed;
      this.accumulatedTime += scaledDelta;

      if (this.activeScene) {
        this.activeScene.update(this.accumulatedTime, scaledDelta, metrics);
      }
    }

    // Render frame (always renders so inspection view is retained when paused)
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Returns current active scene ID.
   */
  public getActiveSceneId(): string | null {
    return this.activeScene ? this.activeScene.id : null;
  }

  /**
   * Returns whether WebGL context is currently lost.
   */
  public isRendererContextLost(): boolean {
    return this.isContextLost;
  }

  /**
   * Explicit cleanup and GPU memory disposal
   */
  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }

    if (this.activeScene) {
      this.activeScene.dispose();
      this.activeScene = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
