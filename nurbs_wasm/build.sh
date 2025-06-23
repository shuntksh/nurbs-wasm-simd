#!/bin/bash

# Build script for NURBS WASM module

echo "🔨 Building NURBS WASM module with SIMD..."

# Build the WASM module
wasm-pack build --target web --out-dir pkg

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Get the project root (assuming we're in nurbs_wasm directory)
    PROJECT_ROOT=".."
    PUBLIC_DIR="$PROJECT_ROOT/pkg"
    
    # Create public directory if it doesn't exist
    mkdir -p "$PUBLIC_DIR"
    
    # Also copy to local pkg for development
    mkdir -p ../pkg
    cp -r pkg/* ../pkg/
    
    echo "✨ Done! WASM module is ready for use in the demo."
    echo ""
    echo "Files copied to:"
    echo "  - Public: $PUBLIC_DIR/"
    echo "  - Local: ../pkg/"
    ls -la "$PUBLIC_DIR/"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi