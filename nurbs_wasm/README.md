# NURBS WASM Module

A WebAssembly module for computing NURBS (Non-Uniform Rational B-Spline) curves with SIMD optimizations.

## Prerequisites

1. **Rust toolchain**
   ```bash
   # Install Rust if you haven't already
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Add WebAssembly target**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. **Install wasm-pack**
   ```bash
   cargo install wasm-pack
   ```

## Building the Module

### Quick Build

From this directory (`nurbs_wasm/`), run:

```bash
wasm-pack build --target web --out-dir pkg
```

This will:
- Compile the Rust code to WebAssembly with SIMD enabled
- Generate JavaScript bindings
- Create TypeScript definitions
- Output everything to the `pkg/` directory

### Build Options

For different build configurations:

```bash
# Development build (faster compile, larger file)
wasm-pack build --dev --target web --out-dir pkg

# Release build with optimizations (default)
wasm-pack build --target web --out-dir pkg

# Build for bundlers like webpack/vite
wasm-pack build --target bundler --out-dir pkg
```

## Generated Files

After building, the `pkg/` directory will contain:

- `nurbs_wasm_bg.wasm` - The WebAssembly binary
- `nurbs_wasm.js` - JavaScript bindings
- `nurbs_wasm.d.ts` - TypeScript definitions
- `nurbs_wasm_bg.wasm.d.ts` - WASM TypeScript definitions
- `package.json` - NPM package metadata

## Copying Artifacts for the Demo

The demo loads WASM files from the public directory. The build script automatically copies files to the correct location.

### Automatic Copy (Recommended)

```bash
# From the nurbs_wasm directory
./build.sh
```

This will:
1. Build the WASM module
2. Copy files to `/public/nurbs-wasm/` for production
3. Copy files to `../pkg/` for local development

### Manual Copy

```bash
# From the nurbs_wasm directory
wasm-pack build --target web --out-dir pkg

# Copy to public directory (required for Astro)
mkdir -p ../../../../../../../../public/nurbs-wasm
cp pkg/nurbs_wasm_bg.wasm ../../../../../../../../public/nurbs-wasm/
cp pkg/nurbs_wasm.js ../../../../../../../../public/nurbs-wasm/
cp pkg/nurbs_wasm.d.ts ../../../../../../../../public/nurbs-wasm/
```

## Integration with the Demo

The demo component (`nurbs-demo.tsx`) loads the WASM module from the public directory:

```typescript
// Load WASM from public directory
const wasmModule = await import('/nurbs-wasm/nurbs_wasm.js');

// Initialize with explicit path to WASM file
await wasmModule.default('/nurbs-wasm/nurbs_wasm_bg.wasm');

// Use the NURBS curve
const curve = new wasmModule.NurbsCurve(3); // degree 3
const point = new wasmModule.ControlPoint(100, 200, 1.0);
curve.add_control_point(point);
```

### Important Notes for Astro/Vite

1. **Public Directory**: WASM files must be in the `public/` directory to be served correctly
2. **Import Path**: Use absolute paths starting with `/` when importing from public
3. **Optimization**: The module is excluded from Vite's optimization in `astro.config.mjs`

## SIMD Configuration

SIMD is enabled via `.cargo/config.toml`:

```toml
[target.wasm32-unknown-unknown]
rustflags = ["-C", "target-feature=+simd128"]
```

This tells Rust to use WASM SIMD instructions for operations on `f64x2` vectors.

## Troubleshooting

### Build Errors

1. **"can't find crate"**
   - Make sure you're in the `nurbs_wasm` directory
   - Run `cargo build` first to check for Rust errors

2. **"wasm-pack: command not found"**
   - Install with: `cargo install wasm-pack`
   - Or use npm: `npm install -g wasm-pack`

3. **SIMD not working**
   - Ensure `.cargo/config.toml` exists with SIMD flags
   - Check browser compatibility (Chrome 91+, Firefox 90+, Safari 16.4+)

### Runtime Errors

1. **"Failed to load WASM module"**
   - Make sure the `pkg` directory exists in the correct location
   - Check that all files were copied from the build
   - Verify the import path in your TypeScript/JavaScript

2. **"SIMD not supported"**
   - Use a modern browser that supports WebAssembly SIMD
   - Implement feature detection and fallback if needed

## Development Workflow

1. Make changes to `src/lib.rs`
2. Build: `wasm-pack build --target web --out-dir pkg`
3. Copy files to demo location
4. Test in browser with the demo

## Performance Notes

The SIMD optimizations in this module:
- Process 2 control points simultaneously using `f64x2` vectors
- Parallelize basis function calculations
- Optimize array conversions

This typically results in 1.5-2x performance improvement for curves with many control points.

## API Reference

### `NurbsCurve`
- `new(degree: number)` - Create a new NURBS curve
- `add_control_point(point: ControlPoint)` - Add a control point
- `generate_points(resolution: number)` - Generate curve points
- `update_control_point(index, x, y, weight)` - Update a point
- `num_control_points()` - Get number of control points
- `get_degree()` - Get curve degree

### `ControlPoint`
- `new(x: number, y: number, weight: number)` - Create a control point
- `x`, `y`, `weight` - Getters for point properties