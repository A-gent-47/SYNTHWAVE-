import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VisualizerCore } from './VisualizerCore';

describe('VisualizerCore', () => {
  let container: HTMLDivElement;
  let visualizer: VisualizerCore;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 1280, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 720, configurable: true });
    document.body.appendChild(container);
    visualizer = new VisualizerCore(container);
  });

  afterEach(() => {
    visualizer.dispose();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('initializes cleanly and attaches WebGL canvas to container', () => {
    expect(container.querySelector('canvas')).toBeDefined();
    expect(visualizer.getActiveSceneId()).toBe('neon-tunnel');
  });

  it('switches between all 3 scenes smoothly', () => {
    visualizer.switchScene('particle-universe');
    expect(visualizer.getActiveSceneId()).toBe('particle-universe');

    visualizer.switchScene('synthwave-horizon');
    expect(visualizer.getActiveSceneId()).toBe('synthwave-horizon');

    visualizer.switchScene('neon-tunnel');
    expect(visualizer.getActiveSceneId()).toBe('neon-tunnel');
  });

  it('handles window resize gracefully', () => {
    expect(() => visualizer.resize(1920, 1080)).not.toThrow();
  });

  it('handles WebGL context lost and restored events gracefully', () => {
    const canvas = container.querySelector('canvas')!;
    expect(canvas).toBeDefined();

    // Dispatch context lost
    const lostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lostEvent);
    expect(visualizer.isRendererContextLost()).toBe(true);

    // Dispatch context restored
    const restoredEvent = new Event('webglcontextrestored');
    canvas.dispatchEvent(restoredEvent);
    expect(visualizer.isRendererContextLost()).toBe(false);
  });

  it('disposes resources and detaches canvas cleanly', () => {
    visualizer.dispose();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
