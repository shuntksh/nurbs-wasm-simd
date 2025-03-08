import { useEffect, useState, useCallback } from "react";
import initWasm, {
	ControlPoint,
	NurbsCurve,
} from "../../nurbs_wasm/pkg/nurbs_wasm";

// Define a type for the WASM module
interface WasmModule {
	ControlPoint: typeof ControlPoint;
	NurbsCurve: typeof NurbsCurve;
}

// Declare the global window type to include wasmModule
declare global {
	interface Window {
		wasmModule: WasmModule;
		wasmInitialized: boolean;
	}
}

// Initialize the WASM module
initWasm()
	.then(() => {
		window.wasmModule = { ControlPoint, NurbsCurve };
		window.wasmInitialized = true;
		console.log("WASM module initialized successfully");
	})
	.catch((err) => {
		console.error("Failed to initialize WASM module:", err);
	});

interface UseNurbsWasmReturn {
	wasmLoaded: boolean;
	curve: NurbsCurve | null;
	controlPoints: ControlPoint[];
	setControlPoints: (points: ControlPoint[]) => void;
	curveDegree: number;
	setCurveDegree: (degree: number) => void;
}

export function useNurbsWasm(): UseNurbsWasmReturn {
	const [wasmLoaded, setWasmLoaded] = useState(false);
	const [curve, setCurve] = useState<NurbsCurve | null>(null);
	const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
	const [curveDegree, setCurveDegree] = useState(3);

	// Initialize WASM module
	useEffect(() => {
		async function loadWasm() {
			try {
				// Wait for the WASM module to be initialized
				if (!window.wasmInitialized) {
					console.log("Waiting for WASM module to initialize...");
					await new Promise<void>((resolve) => {
						const checkModule = () => {
							if (window.wasmInitialized) {
								// We'll initialize control points in App.tsx
								resolve();
							} else {
								setTimeout(checkModule, 100);
							}
						};
						checkModule();
					});
				}

				console.log("WASM module ready to use");

				// Create initial curve with degree 3
				const initialCurve = new NurbsCurve(3);
				console.log("Initial curve created successfully");

				// Set state
				setWasmLoaded(true);
				setCurve(initialCurve);
				setCurveDegree(3);
			} catch (error) {
				console.error("Failed to load WASM module:", error);
			}
		}

		loadWasm();
	}, []);

	// Update curve when control points or degree changes
	useEffect(() => {
		if (!wasmLoaded) {
			console.log("WASM not loaded yet, skipping curve update");
			return;
		}

		try {
			console.log(`Creating new curve with degree ${curveDegree}`);

			// Create a new curve with the current degree
			const newCurve = new NurbsCurve(curveDegree);
			console.log("New curve created successfully");

			// Only try to add control points if we have any
			if (controlPoints.length > 0) {
				console.log(`Adding ${controlPoints.length} control points to curve`);

				// Add each control point individually with error handling
				for (let i = 0; i < controlPoints.length; i++) {
					try {
						const point = controlPoints[i];

						// Skip null or invalid points
						if (
							!point ||
							typeof point.x !== "number" ||
							typeof point.y !== "number" ||
							typeof point.weight !== "number"
						) {
							console.log(`Skipping invalid control point at index ${i}`);
							continue;
						}

						console.log(
							`Adding control point ${i}: (${point.x}, ${point.y}, ${point.weight})`,
						);

						// Create a new point to ensure it's valid
						const newPoint = new ControlPoint(point.x, point.y, point.weight);
						newCurve.add_control_point(newPoint);
					} catch (error) {
						console.error(`Error adding control point at index ${i}:`, error);
					}
				}
			}

			// Update the curve state
			setCurve(newCurve);
			console.log("Curve updated successfully");
		} catch (error) {
			console.error("Error updating curve:", error);
		}
	}, [wasmLoaded, controlPoints, curveDegree]);

	return {
		wasmLoaded,
		curve,
		controlPoints,
		setControlPoints,
		curveDegree,
		setCurveDegree,
	};
}
