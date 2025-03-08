import { useState } from "react";
import Code from "./code";
import InlineCode from "./components/InlineCode";
import Section from "./components/Section";
import Editor from "./editor";

function App() {
	const [darkMode] = useState(true);
	return (
		<div
			className={`min-h-screen font-inter ${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
		>
			<header className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white py-16 px-4 md:px-8">
				<div className="container mx-auto max-w-4xl">
					<h1 className="text-4xl md:text-5xl font-bold mb-4">
						Canvas Rendering with WebAssembly SIMD
					</h1>
					<p className="text-xl md:text-2xl text-blue-100">
						Learn How to Use WASM-SIMD by Implementing NURBS Curve Editor in
						Rust
					</p>
				</div>
			</header>

			<main className="container mx-auto max-w-4xl md:px-8 py-8">
				<Section id="interactive-editor">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Interactive NURBS Curve Editor
					</h2>
					<p className="text-gray-600 mb-6">
						Tap or click on the canvas to add control points. Drag points to
						move them.
					</p>
					<div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
						<Editor />
					</div>
				</Section>

				<Section>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							WebAssembly (WASM) has revolutionized web performance by allowing
							developers to run near-native speed code in browsers. When
							combined with SIMD (Single Instruction, Multiple Data)
							instructions, WASM becomes even more powerful, enabling parallel
							data processing that can significantly boost performance for
							computationally intensive tasks.
						</p>
						<p>
							In this post, I'll walk you through implementing WASM SIMD using a
							real-world example: a NURBS (Non-Uniform Rational B-Spline) curve
							editor. NURBS curves are widely used in computer graphics and CAD
							applications, requiring complex mathematical calculations that
							benefit greatly from SIMD optimizations.
						</p>
					</div>
				</Section>

				<Section id="what-is-wasm-simd">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						What is WASM SIMD?
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							SIMD instructions allow a single operation to be performed on
							multiple data points simultaneously. For example, instead of
							adding numbers one at a time, SIMD can add four or eight pairs of
							numbers in a single instruction. This parallelism is particularly
							valuable for graphics, physics simulations, and other
							computation-heavy applications.
						</p>
						<p>
							WebAssembly SIMD extends the WASM instruction set with 128-bit
							packed SIMD operations, similar to SSE instructions in x86
							processors. This enables significant performance improvements for
							suitable algorithms.
						</p>
					</div>
				</Section>

				<Section id="setting-up">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Setting Up Your Environment
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">To get started with WASM SIMD, you'll need:</p>
						<ol className="list-decimal pl-6 mb-6 space-y-2">
							<li>
								<strong>Rust toolchain</strong> - We'll use Rust to write our
								SIMD-optimized code
							</li>
							<li>
								<strong>wasm-pack</strong> - For building and packaging
								Rust-generated WebAssembly
							</li>
							<li>
								<strong>Node.js and npm</strong> - For our web application
							</li>
						</ol>

						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 1: Install the Rust toolchain
						</h3>
						<p className="mb-3">If you don't have Rust installed:</p>
					</div>
					<div className="mb-4">
						<Code
							code="curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
							language="bash"
							showLineNumbers={false}
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<p className="mb-3">Add the WebAssembly target:</p>
					</div>
					<div className="mb-4">
						<Code
							code="rustup target add wasm32-unknown-unknown"
							language="bash"
							showLineNumbers={false}
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 2: Install wasm-pack
						</h3>
					</div>
					<div className="mb-4">
						<Code
							code="cargo install wasm-pack"
							language="bash"
							showLineNumbers={false}
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 3: Set up a new project
						</h3>
						<p className="mb-3">
							Create a project structure similar to our example:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`project-root/
├── nurbs_wasm/         # Rust WASM module
│   ├── .cargo/
│   │   └── config.toml # SIMD configuration
│   ├── src/
│   │   └── lib.rs      # Rust implementation
│   └── Cargo.toml      # Rust dependencies
├── web/                # Web application
│   ├── src/
│   │   └── ...         # React components
│   └── ...             # Web app configuration
├── copy-wasm.js        # Script to copy WASM files
└── package.json        # Project scripts`}
							language="bash"
							fileName="Project Structure"
							className="mb-4"
						/>
					</div>
				</Section>

				<Section id="enabling-simd">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Enabling SIMD in Your Rust WebAssembly Project
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							The key to enabling SIMD in your Rust WASM project is proper
							configuration. Let's look at how to set this up.
						</p>

						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 1: Configure Rust for WASM SIMD
						</h3>
						<p className="mb-3">
							Create a <InlineCode>.cargo/config.toml</InlineCode> file in your
							Rust project with the following content:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`[target.wasm32-unknown-unknown]
rustflags = ["-C", "target-feature=+simd128"]`}
							language="toml"
							fileName=".cargo/config.toml"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<p className="mb-4">
							This tells the Rust compiler to enable SIMD instructions when
							targeting WebAssembly.
						</p>

						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 2: Set up your Cargo.toml
						</h3>
						<p className="mb-3">
							Your <InlineCode>Cargo.toml</InlineCode> should include the
							necessary dependencies:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`[package]
name = "nurbs_wasm"
version = "0.1.0"
edition = "2021"
description = "NURBS curve generator using WASM SIMD"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2.87"
js-sys = "0.3.64"
console_error_panic_hook = { version = "0.1.7", optional = true }
# Add other dependencies as needed

[profile.release]
opt-level = 3
lto = true`}
							language="toml"
							fileName="Cargo.toml"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<p>
							The <InlineCode>crate-type = ["cdylib", "rlib"]</InlineCode> line
							is important as it tells Cargo to build a dynamic library
							compatible with WebAssembly.
						</p>
					</div>
				</Section>

				<Section id="implementing-simd">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Implementing SIMD-Optimized Code in Rust
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							Now let's look at how to implement SIMD-optimized code in Rust.
							Our example uses a NURBS curve implementation, which involves
							vector operations that can benefit from SIMD.
						</p>
						<p className="mb-3">
							Here's a simplified excerpt from our implementation:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ControlPoint {
    x: f64,
    y: f64,
    weight: f64,
}

#[wasm_bindgen]
impl ControlPoint {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, weight: f64) -> ControlPoint {
        ControlPoint { x, y, weight }
    }
    
    // Getters and setters...
}

#[wasm_bindgen]
pub struct NurbsCurve {
    control_points: Vec<ControlPoint>,
    knots: Vec<f64>,
    degree: usize,
}

#[wasm_bindgen]
impl NurbsCurve {
    #[wasm_bindgen(constructor)]
    pub fn new(degree: usize) -> NurbsCurve {
        NurbsCurve {
            control_points: Vec::new(),
            knots: Vec::new(),
            degree,
        }
    }
    
    // Methods for NURBS curve manipulation...
    
    // SIMD-optimized curve point generation
    pub fn generate_points(&self, num_points: usize) -> Vec<ControlPoint> {
        // Implementation that benefits from SIMD...
    }
}`}
							language="rust"
							fileName="src/lib.rs"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<p>
							While the above code doesn't explicitly show SIMD instructions,
							the Rust compiler will automatically vectorize suitable operations
							when SIMD is enabled. For more explicit SIMD usage, you can use
							the <InlineCode>std::simd</InlineCode> module or the{" "}
							<InlineCode>packed_simd</InlineCode> crate.
						</p>
					</div>
				</Section>

				<Section id="building-wasm">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Building Your WASM Module
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							With your Rust code ready, it's time to build the WebAssembly
							module.
						</p>

						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 1: Create build scripts
						</h3>
						<p className="mb-3">
							In your project's <InlineCode>package.json</InlineCode>, add
							scripts for building the WASM module:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`{
  "scripts": {
    "build:wasm": "cd nurbs_wasm && wasm-pack build --target web",
    "copy:wasm": "node copy-wasm.js",
    "build": "npm run build:wasm && npm run copy:wasm && cd web && npm run build",
    "dev": "npm run build:wasm && npm run copy:wasm && cd web && npm run dev"
  }
}`}
							language="json"
							fileName="package.json"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 2: Create a script to copy WASM files
						</h3>
						<p className="mb-3">
							Create a <InlineCode>copy-wasm.js</InlineCode> file to copy the
							built WASM files to your web application:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define source and destination paths
const sourceDir = join(__dirname, 'nurbs_wasm', 'pkg');
const destDir = join(__dirname, 'web', 'nurbs_wasm', 'pkg');

// Create destination directory if it doesn't exist
if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

// Files to copy
const files = [
  'nurbs_wasm.js',
  'nurbs_wasm_bg.wasm',
  'nurbs_wasm.d.ts',
  'nurbs_wasm_bg.wasm.d.ts',
];

// Copy each file
for (const file of files) {
  const sourcePath = join(sourceDir, file);
  const destPath = join(destDir, file);
  
  try {
    copyFileSync(sourcePath, destPath);
    console.log(\`Copied \${file} to \${destDir}\`);
  } catch (error) {
    console.error(\`Error copying \${file}:\`, error);
  }
}`}
							language="javascript"
							fileName="copy-wasm.js"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 3: Build the WASM module
						</h3>
						<p className="mb-3">Run the build script:</p>
					</div>
					<div className="mb-4">
						<Code
							code="npm run build:wasm"
							language="bash"
							showLineNumbers={false}
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<p>
							This will compile your Rust code to WebAssembly with SIMD
							optimizations enabled.
						</p>
					</div>
				</Section>

				<Section id="integrating-wasm">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Integrating WASM SIMD with Your Web Application
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							Now let's integrate the WASM module with a web application. Our
							example uses React, but the principles apply to any JavaScript
							framework.
						</p>

						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 1: Configure your bundler for WASM
						</h3>
						<p className="mb-3">
							If you're using Vite (as in our example), configure it to handle
							WASM files:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
  ],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['nurbs_wasm'],
  },
});`}
							language="typescript"
							fileName="vite.config.ts"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 2: Create TypeScript definitions
						</h3>
						<p className="mb-3">
							Create TypeScript definitions for your WASM module:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`// nurbs-wasm.d.ts
declare module 'nurbs_wasm' {
  export class ControlPoint {
    constructor(x: number, y: number, weight: number);
    readonly x: number;
    readonly y: number;
    readonly weight: number;
    set_x(x: number): void;
    set_y(y: number): void;
    set_weight(weight: number): void;
  }

  export class NurbsCurve {
    constructor(degree: number);
    add_control_point(control_point: ControlPoint): void;
    set_knots(knots: Float64Array): void;
    evaluate(u: number): ControlPoint | null;
    generate_points(num_points: number): (ControlPoint | null)[];
    num_control_points(): number;
    get_control_point(index: number): ControlPoint | null;
    update_control_point(index: number, x: number, y: number, weight: number): boolean;
    get_degree(): number;
  }

  export function generate_nurbs_curve_points(
    control_points_x: Float64Array,
    control_points_y: Float64Array,
    weights: Float64Array,
    degree: number,
    num_points: number
  ): Float64Array;

  export function init_panic_hook(): void;
}`}
							language="typescript"
							fileName="nurbs-wasm.d.ts"
							className="mb-4"
						/>
					</div>
					<div className="prose prose-lg max-w-none">
						<h3 className="text-xl font-semibold mt-6 mb-3">
							Step 3: Import and use the WASM module in your application
						</h3>
						<p className="mb-3">
							Now you can import and use your WASM module in your React
							components:
						</p>
					</div>
					<div className="mb-4">
						<Code
							code={`import { useEffect, useState } from 'react';
import initWasm, { ControlPoint, NurbsCurve } from '../nurbs_wasm/pkg/nurbs_wasm';

function App() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [curve, setCurve] = useState<NurbsCurve | null>(null);
  
  // Initialize WASM module
  useEffect(() => {
    async function loadWasm() {
      try {
        await initWasm();
        const initialCurve = new NurbsCurve(3);
        setWasmLoaded(true);
        setCurve(initialCurve);
      } catch (error) {
        console.error('Failed to load WASM module:', error);
      }
    }
    
    loadWasm();
  }, []);
  
  // Use the WASM module to generate curve points
  const generateCurvePoints = () => {
    if (!curve) return [];
    
    try {
      return curve.generate_points(100);
    } catch (error) {
      console.error('Error generating curve points:', error);
      return [];
    }
  };
  
  // Rest of your component...
}`}
							language="tsx"
							fileName="App.tsx"
							className="mb-4"
						/>
					</div>
				</Section>

				<Section id="running-app">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Running Your Application
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							With everything set up, you can now run your application:
						</p>
						<div className="mb-4">
							<Code
								code="npm run dev"
								language="bash"
								showLineNumbers={false}
								className="mb-4"
							/>
						</div>
						<p className="mb-3">This will:</p>
						<ol className="list-decimal pl-6 mb-4 space-y-2">
							<li>Build the Rust WASM module with SIMD optimizations</li>
							<li>Copy the WASM files to your web application</li>
							<li>Start the development server</li>
						</ol>
					</div>
				</Section>

				<Section id="performance">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Performance Benefits
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							SIMD can provide significant performance improvements for
							computationally intensive tasks. In our NURBS curve example,
							operations like:
						</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Evaluating basis functions</li>
							<li>Calculating curve points</li>
							<li>Processing multiple control points</li>
						</ul>
						<p>
							All benefit from SIMD parallelism. Depending on the specific
							operations, you might see performance improvements of 2-4x or even
							more compared to scalar code.
						</p>
					</div>
				</Section>

				<Section id="compatibility">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Browser Compatibility
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">WASM SIMD is supported in:</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Chrome/Edge 91+</li>
							<li>Firefox 90+</li>
							<li>Safari 16.4+</li>
						</ul>
						<p>
							For browsers that don't support SIMD, you can provide a fallback
							implementation or use feature detection.
						</p>
					</div>
				</Section>

				<Section id="conclusion">
					<h2 className="text-2xl md:text-3xl font-semibold mb-4">
						Conclusion
					</h2>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="mb-4">
							WebAssembly SIMD brings powerful parallel processing capabilities
							to web applications. By following the steps outlined in this post,
							you can harness this power for your own projects, whether you're
							building graphics applications, simulations, or any
							computationally intensive web application.
						</p>
						<p className="mb-4">
							The NURBS curve editor example demonstrates how WASM SIMD can be
							used in a real-world application, providing smooth, responsive
							performance even for complex mathematical operations. The
							combination of Rust's safety and performance with WebAssembly's
							near-native speed and SIMD's parallelism creates a powerful
							toolkit for web developers.
						</p>
						<p>
							Give it a try in your next project, and experience the performance
							benefits firsthand!
						</p>
					</div>
				</Section>

				<Section>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-400 italic mb-2">
							Want to see the complete code? Check out the
							<a
								href="https://github.com/yourusername/wasm-simd-nurbs"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mx-1"
							>
								WASM SIMD NURBS Curve Generator repository
							</a>
							on GitHub.
						</p>
						<p className="text-gray-500 dark:text-gray-400 italic">
							Last updated: March 2025
						</p>
					</div>
				</Section>
			</main>
		</div>
	);
}

export default App;
