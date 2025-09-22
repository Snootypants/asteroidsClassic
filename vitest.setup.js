import { vi } from 'vitest';

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(function(type) {
  if (type === '2d') {
    return {
      canvas: this,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      filter: 'none',
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      drawImage: vi.fn(),
      createImageData: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      createPattern: vi.fn(),
      setLineDash: vi.fn(),
      getLineDash: vi.fn(() => []),
      lineDashOffset: 0
    };
  }
  return null;
});

// Mock getBoundingClientRect
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(function() {
  return {
    x: 0,
    y: 0,
    width: 1200,
    height: 900,
    top: 0,
    right: 1200,
    bottom: 900,
    left: 0
  };
});

// Mock requestAnimationFrame and cancelAnimationFrame
globalThis.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

globalThis.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});
