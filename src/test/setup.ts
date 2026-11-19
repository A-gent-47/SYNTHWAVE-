import '@testing-library/jest-dom';

// Mock window.HTMLMediaElement prototype methods for audio testing in jsdom
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => 'blob:mock-audio-url';
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  window.URL.revokeObjectURL = () => {};
}

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}

// Mock WebGL context for Three.js in jsdom environment with Proxy fallback
if (typeof HTMLCanvasElement.prototype.getContext === 'function') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  (HTMLCanvasElement.prototype as any).getContext = function (contextType: string, ...args: unknown[]) {
    if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
      const baseContext: Record<string, any> = {
        canvas: this,
        VERSION: 7938,
        getExtension: () => null,
        getParameter: (p: unknown) => {
          if (p === 7938 || p === undefined) return 'WebGL 1.0';
          return 0;
        },
        getShaderPrecisionFormat: () => ({
          rangeMin: 127,
          rangeMax: 127,
          precision: 23
        }),
        getProgramParameter: (_program: unknown, param: unknown) => {
          if (param === 35718 || param === 35721) return 0;
          return true;
        },
        getShaderParameter: () => true,
        getShaderInfoLog: () => '',
        getProgramInfoLog: () => '',
        createTexture: () => ({}),
        createProgram: () => ({}),
        createShader: () => ({}),
        createBuffer: () => ({}),
        createFramebuffer: () => ({}),
        createRenderbuffer: () => ({}),
        getActiveUniform: () => ({ name: 'uMock', size: 1, type: 5126 }),
        getUniformLocation: () => ({}),
        getActiveAttrib: () => ({ name: 'aMock', size: 1, type: 5126 }),
        getAttribLocation: () => 0
      };

      return new Proxy(baseContext, {
        get(target, prop: string) {
          if (prop in target) {
            return target[prop];
          }
          // Default no-op for any unmocked WebGL method
          return () => {};
        }
      });
    }
    return originalGetContext.call(this, contextType as any, ...args);
  };
}
