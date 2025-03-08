import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), react(), wasm()],
	base: "./", // Set base path for GitHub Pages
	build: {
		target: "esnext",
	},
	optimizeDeps: {
		exclude: ["nurbs_wasm"],
	},
	server: {
		fs: {
			// Allow serving files from one level up (the project root)
			allow: [".."],
		},
	},
});
