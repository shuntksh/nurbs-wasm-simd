import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the WASM module
vi.mock('nurbs_wasm', () => {
  return import('./mocks/nurbs_wasm');
});

// Mock window.wasmModule
Object.defineProperty(window, 'wasmModule', {
  value: {
    ControlPoint: vi.fn(),
    NurbsCurve: vi.fn(),
  },
  writable: true,
});

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fillText: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: '',
  textBaseline: '',
  canvas: null,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext as unknown as CanvasRenderingContext2D);
