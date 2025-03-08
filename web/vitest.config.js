import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), wasm()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		includeSource: ["src/**/*.{js,ts,jsx,tsx}"],
	},
	resolve: {
		alias: {
			nurbs_wasm: resolve(__dirname, "./nurbs_wasm/nurbs_wasm.js"),
		},
	},
});
