# WASM SIMD NURBS Curve Generator

*This repository was generated with the assistance of Cline, an AI coding assistant.*

A WebAssembly (WASM) SIMD-accelerated NURBS curve generator implemented in Rust with a React-based interactive editor.

## Overview

This project demonstrates the use of WebAssembly SIMD instructions to efficiently generate and render NURBS (Non-Uniform Rational B-Spline) curves. It consists of:

1. A Rust-based WASM module that implements the NURBS curve mathematics with SIMD optimizations
2. A React web application that provides an interactive UI for creating and manipulating NURBS curves

The application allows users to:
- Add control points by clicking on the canvas
- Move control points by dragging them
- Adjust control point weights to change curve behavior
- Modify the curve degree and resolution
- Delete control points

## Project Structure

- `nurbs_wasm/`: Rust WASM module for NURBS curve generation
  - Uses SIMD instructions for performance optimization
  - Implements NURBS curve mathematics with control points, weights, and knots
- `web/`: React web application
  - Canvas-based UI for interacting with NURBS curves
  - Real-time rendering of curves based on control points
- `copy-wasm.js`: Script to copy WASM files from Rust build to web application

## Prerequisites

- Rust toolchain (cargo, rustup, rustc)
- wasm-pack
- Node.js and npm

## Building and Running

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Development mode:**

   ```bash
   npm run dev
   ```

   This will:
   - Build the Rust WASM module with SIMD optimizations
   - Copy the WASM files to the web application
   - Start the Vite development server

3. **Production build:**

   ```bash
   npm run build
   ```

   This will create a production-ready build in the `web/dist` directory.

## How It Works

1. **NURBS Implementation (Rust):**
   - The Rust code implements a NURBS curve generator with control points, weights, and knot vectors
   - WASM SIMD instructions are used to optimize curve calculations
   - The implementation is exposed to JavaScript through wasm-bindgen

2. **Web Interface (React):**
   - The React application provides a canvas for visualizing and interacting with the curve
   - Users can add, move, and delete control points
   - The application dynamically updates the curve as control points are modified
   - Controls are provided for adjusting curve parameters like degree and resolution

## Technical Details

- **WASM SIMD:** The project uses WebAssembly SIMD (Single Instruction, Multiple Data) instructions for parallel processing of curve calculations
- **NURBS Mathematics:** Implements the mathematical foundations of NURBS curves, including basis functions, knot vectors, and weighted control points
- **React + TypeScript:** The web application is built with React and TypeScript for type safety
- **Vite:** Uses Vite for fast development and optimized production builds

## Usage

1. Open the application in a browser
2. Click on the canvas to add control points
3. Drag control points to move them
4. Use the sliders to adjust:
   - Curve degree (affects the smoothness and how many control points influence each part of the curve)
   - Curve resolution (number of points used to render the curve)
   - Control point weights (when a point is selected)
5. Use the buttons to clear all points or delete selected points
