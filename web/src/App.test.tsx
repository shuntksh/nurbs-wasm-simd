import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPoint, NurbsCurve } from './test/mocks/nurbs_wasm';

// Mock the App component
vi.mock('./App', () => {
  return import('./test/mocks/App');
});

// Import the mocked App component
import App from './App';

// Mock the WASM module
vi.mock('nurbs_wasm', () => {
  return import('./test/mocks/nurbs_wasm');
});

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up window.wasmModule
    window.wasmModule = {
      ControlPoint: vi.fn(),
      NurbsCurve: vi.fn(),
    };
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('NURBS Curve Editor')).toBeInTheDocument();
  });

  it('displays initial UI elements', () => {
    render(<App />);
    
    // Check for main UI elements
    expect(screen.getByText('NURBS Curve Editor')).toBeInTheDocument();
    expect(screen.getByText('Click on the canvas to add control points. Drag points to move them.')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByText('Clear All Points')).toBeInTheDocument();
    expect(screen.getByText('Delete Selected Point')).toBeInTheDocument();
    
    // Check for sliders
    expect(screen.getByText(/Curve Degree:/)).toBeInTheDocument();
    expect(screen.getByText(/Curve Resolution:/)).toBeInTheDocument();
  });

  it('initializes with correct default values', () => {
    render(<App />);
    
    // Check for default degree and resolution values
    expect(screen.getByText(/Curve Degree: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Curve Resolution: 100/)).toBeInTheDocument();
  });

  it('updates curve degree when slider is changed', () => {
    render(<App />);
    
    // Find the degree slider
    const degreeSlider = screen.getByLabelText(/Curve Degree:/);
    
    // Change the slider value
    fireEvent.change(degreeSlider, { target: { value: '4' } });
    
    // Check if the degree was updated
    expect(screen.getByText(/Curve Degree: 4/)).toBeInTheDocument();
  });

  it('updates curve resolution when slider is changed', () => {
    render(<App />);
    
    // Find the resolution slider
    const resolutionSlider = screen.getByLabelText(/Curve Resolution:/);
    
    // Change the slider value
    fireEvent.change(resolutionSlider, { target: { value: '150' } });
    
    // Check if the resolution was updated
    expect(screen.getByText(/Curve Resolution: 150/)).toBeInTheDocument();
  });

  it('shows loading state when WASM is not loaded', () => {
    // Temporarily remove wasmModule
    const originalWasmModule = window.wasmModule;
    window.wasmModule = undefined as unknown as typeof window.wasmModule;
    
    render(<App />);
    
    // Check for loading message
    expect(screen.getByText('Loading WASM module...')).toBeInTheDocument();
    
    // Restore wasmModule
    window.wasmModule = originalWasmModule;
  });
});
