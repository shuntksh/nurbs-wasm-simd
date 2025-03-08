/**
 * @fileoverview Script to copy WASM files from the build directory to the web directory
 * @typedef {import('fs')}
 * @typedef {import('path')}
 * @typedef {import('url')}
 */

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define source and destination paths
const sourceDir = join(__dirname, "nurbs_wasm", "pkg");
const destDir = join(__dirname, "web", "nurbs_wasm", "pkg");

// Create destination directory if it doesn't exist
if (!existsSync(destDir)) {
	mkdirSync(destDir, { recursive: true });
}

// Files to copy
const files = [
	"nurbs_wasm.js",
	"nurbs_wasm_bg.wasm",
	"nurbs_wasm.d.ts",
	"nurbs_wasm_bg.wasm.d.ts",
];

// Copy each file
for (const file of files) {
	const sourcePath = join(sourceDir, file);
	const destPath = join(destDir, file);

	try {
		copyFileSync(sourcePath, destPath);
		console.log(`Copied ${file} to ${destDir}`);
	} catch (error) {
		console.error(`Error copying ${file}:`, error);
	}
}

console.log("WASM files copied successfully!");
