import { useCallback, useEffect, useRef, useState } from "react";
import { ControlPoint } from "../nurbs_wasm/pkg/nurbs_wasm";
import { useNurbsWasm } from "./hooks/useNurbsWasm";

// Default canvas dimensions (will be adjusted based on viewport)
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;
const ASPECT_RATIO = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;

// Control point appearance
const CONTROL_POINT_RADIUS = 8;
const SELECTED_CONTROL_POINT_RADIUS = 10;
const CONTROL_POINT_COLOR = "#4CAF50";
const SELECTED_CONTROL_POINT_COLOR = "#FF5722";
const CURVE_COLOR = "#2196F3";
const CURVE_WIDTH = 2;

function Editor() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [canvasSize, setCanvasSize] = useState({
		width: DEFAULT_CANVAS_WIDTH,
		height: DEFAULT_CANVAS_HEIGHT,
	});
	const {
		wasmLoaded,
		curve,
		controlPoints,
		setControlPoints,
		curveDegree,
		setCurveDegree,
	} = useNurbsWasm();

	const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
		null,
	);
	const [isDragging, setIsDragging] = useState(false);
	const [curveResolution, setCurveResolution] = useState(100);
	const [selectedWeight, setSelectedWeight] = useState(1.0);

	// Function to adjust control points based on canvas size
	const adjustControlPoints = useCallback(
		(
			oldSize: { width: number; height: number },
			newSize: { width: number; height: number },
		) => {
			if (controlPoints.length === 0) return;

			// Calculate scale factors
			const scaleX = newSize.width / oldSize.width;
			const scaleY = newSize.height / oldSize.height;

			// Create new control points with adjusted positions
			const adjustedPoints = controlPoints.map((point) => {
				return new ControlPoint(
					point.x * scaleX,
					point.y * scaleY,
					point.weight,
				);
			});

			setControlPoints(adjustedPoints);
		},
		[controlPoints, setControlPoints],
	);

	// Resize handler to make canvas responsive
	const handleResize = useCallback(() => {
		if (!containerRef.current) return;

		const container = containerRef.current;
		const containerWidth = container.clientWidth;

		// Calculate height based on aspect ratio, with a maximum height
		const maxHeight = window.innerHeight * 0.7; // 70% of viewport height
		const calculatedHeight = containerWidth / ASPECT_RATIO;
		const height = Math.min(calculatedHeight, maxHeight);

		// Store old size for point adjustment
		const oldSize = { ...canvasSize };
		const newSize = { width: containerWidth, height };

		// Update canvas size
		setCanvasSize(newSize);

		// Adjust control points if they exist
		if (controlPoints.length > 0) {
			adjustControlPoints(oldSize, newSize);
		}
	}, [canvasSize, controlPoints.length, adjustControlPoints]);

	// Initialize canvas size and set up resize listener
	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	// Update canvas element size when canvasSize changes
	useEffect(() => {
		if (!canvasRef.current) return;
		canvasRef.current.width = canvasSize.width;
		canvasRef.current.height = canvasSize.height;
	}, [canvasSize]);

	// Initialize control points based on canvas size when WASM is loaded
	useEffect(() => {
		if (!wasmLoaded || controlPoints.length > 0) return;

		// Create initial control points based on relative positions
		const width = canvasSize.width;
		const height = canvasSize.height;

		setControlPoints([
			new ControlPoint(width * 0.125, height * 0.167, 1.0), // ~(100, 100) in 800x600
			new ControlPoint(width * 0.625, height * 0.167, 1.0), // ~(500, 100) in 800x600
			new ControlPoint(width * 0.125, height * 0.833, 1.0), // ~(100, 500) in 800x600
			new ControlPoint(width * 0.625, height * 0.833, 1.0), // ~(500, 500) in 800x600
			new ControlPoint(width * 0.875, height * 0.167, 1.0), // ~(700, 100) in 800x600
		]);
	}, [wasmLoaded, canvasSize, controlPoints.length, setControlPoints]);

	// Draw the curve and control points
	useEffect(() => {
		if (!canvasRef.current || !wasmLoaded || !curve) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw control points
		controlPoints.forEach((point, index) => {
			ctx.beginPath();
			ctx.arc(
				point.x,
				point.y,
				index === selectedPointIndex
					? SELECTED_CONTROL_POINT_RADIUS
					: CONTROL_POINT_RADIUS,
				0,
				Math.PI * 2,
			);
			ctx.fillStyle =
				index === selectedPointIndex
					? SELECTED_CONTROL_POINT_COLOR
					: CONTROL_POINT_COLOR;
			ctx.fill();

			// Draw weight indicator (size of circle proportional to weight)
			ctx.beginPath();
			ctx.arc(
				point.x,
				point.y,
				CONTROL_POINT_RADIUS * point.weight * 0.5,
				0,
				Math.PI * 2,
			);
			ctx.strokeStyle = "white";
			ctx.stroke();

			// Draw index number
			ctx.fillStyle = "white";
			ctx.font = "12px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(index.toString(), point.x, point.y);
		});

		// Draw curve if we have enough control points
		if (controlPoints.length >= curveDegree + 1 && curve) {
			try {
				// Generate points with error handling
				const curvePoints = curve.generate_points(curveResolution);

				if (curvePoints && curvePoints.length > 0) {
					// Filter out any null points
					const validPoints = curvePoints.filter(
						(point) => point !== null && typeof point === "object",
					);

					if (
						validPoints.length > 0 &&
						validPoints[0] &&
						typeof validPoints[0].x === "number" &&
						typeof validPoints[0].y === "number"
					) {
						ctx.beginPath();
						ctx.moveTo(validPoints[0].x, validPoints[0].y);

						let hasValidPath = true;

						for (let i = 1; i < validPoints.length; i++) {
							if (
								validPoints[i] &&
								typeof validPoints[i].x === "number" &&
								typeof validPoints[i].y === "number"
							) {
								ctx.lineTo(validPoints[i].x, validPoints[i].y);
							} else {
								hasValidPath = false;
								break;
							}
						}

						if (hasValidPath) {
							ctx.strokeStyle = CURVE_COLOR;
							ctx.lineWidth = CURVE_WIDTH;
							ctx.stroke();
						}
					}
				}
			} catch (error) {
				console.error("Error generating or drawing curve points:", error);
			}
		}

		// Draw control polygon
		if (controlPoints.length > 1) {
			ctx.beginPath();
			ctx.moveTo(controlPoints[0].x, controlPoints[0].y);

			for (let i = 1; i < controlPoints.length; i++) {
				ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
			}

			ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}, [
		wasmLoaded,
		curve,
		controlPoints,
		selectedPointIndex,
		curveResolution,
		curveDegree,
	]);

	// Update selected weight when a control point is selected
	useEffect(() => {
		if (
			selectedPointIndex !== null &&
			selectedPointIndex < controlPoints.length
		) {
			setSelectedWeight(controlPoints[selectedPointIndex].weight);
		}
	}, [selectedPointIndex, controlPoints]);

	// Handle mouse/touch down on canvas
	const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || !wasmLoaded || !curve) {
			console.log("Cannot handle mouse down: canvas, WASM, or curve not ready");
			return;
		}

		try {
			const canvas = canvasRef.current;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			console.log(`Pointer down at (${x}, ${y})`);

			// Check if we clicked on an existing control point
			for (let i = 0; i < controlPoints.length; i++) {
				const point = controlPoints[i];

				if (!point) continue;

				// Use ** operator instead of Math.pow as suggested by linter
				const dx = point.x - x;
				const dy = point.y - y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance <= CONTROL_POINT_RADIUS * 2) {
					console.log(`Selected existing point at index ${i}`);
					setSelectedPointIndex(i);
					setIsDragging(true);
					return;
				}
			}

			// If not, add a new control point
			console.log("Creating new control point");

			// Create a simple JavaScript object first
			const pointData = { x, y, weight: 1.0 };

			// Then create the ControlPoint from the object
			const newPoint = new ControlPoint(
				pointData.x,
				pointData.y,
				pointData.weight,
			);

			console.log("New control point created successfully");

			// Create a new array with the new point
			const updatedPoints = [...controlPoints, newPoint];
			setControlPoints(updatedPoints);
			setSelectedPointIndex(updatedPoints.length - 1);

			console.log(`Added new point, total points: ${updatedPoints.length}`);
		} catch (error) {
			console.error("Error in handleMouseDown:", error);
		}
	};

	// Handle mouse/touch move on canvas
	const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!canvasRef.current || !isDragging || selectedPointIndex === null)
			return;

		try {
			const canvas = canvasRef.current;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Update the selected control point position
			const updatedPoints = [...controlPoints];

			// Safety check
			if (selectedPointIndex >= updatedPoints.length) {
				return;
			}

			const currentPoint = updatedPoints[selectedPointIndex];

			// Safety check for currentPoint
			if (!currentPoint) {
				return;
			}

			// Get the weight safely
			const weight =
				typeof currentPoint.weight === "number" ? currentPoint.weight : 1.0;

			// Create a new point with updated coordinates but same weight
			const newPoint = new ControlPoint(x, y, weight);
			updatedPoints[selectedPointIndex] = newPoint;

			setControlPoints(updatedPoints);
		} catch (error) {
			console.error("Error updating control point:", error);
		}
	};

	// Handle mouse/touch up on canvas
	const handlePointerUp = () => {
		setIsDragging(false);
	};

	// Handle weight change
	const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const newWeight = Number.parseFloat(e.target.value);
			setSelectedWeight(newWeight);

			if (selectedPointIndex !== null) {
				const updatedPoints = [...controlPoints];

				// Safety check
				if (selectedPointIndex >= updatedPoints.length) {
					return;
				}

				const currentPoint = updatedPoints[selectedPointIndex];

				// Safety check for currentPoint
				if (!currentPoint) {
					return;
				}

				// Get coordinates safely
				const x = typeof currentPoint.x === "number" ? currentPoint.x : 0;
				const y = typeof currentPoint.y === "number" ? currentPoint.y : 0;

				// Create a new point with the same coordinates but updated weight
				const newPoint = new ControlPoint(x, y, newWeight);
				updatedPoints[selectedPointIndex] = newPoint;

				setControlPoints(updatedPoints);
			}
		} catch (error) {
			console.error("Error updating control point weight:", error);
		}
	};

	// Handle degree change
	const handleDegreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const newDegree = Number.parseInt(e.target.value, 10);
			setCurveDegree(newDegree);
		} catch (error) {
			console.error("Error updating curve degree:", error);
		}
	};

	// Handle resolution change
	const handleResolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const newResolution = Number.parseInt(e.target.value, 10);
			setCurveResolution(newResolution);
		} catch (error) {
			console.error("Error updating curve resolution:", error);
		}
	};

	// Clear all control points
	const handleClear = () => {
		setControlPoints([]);
		setSelectedPointIndex(null);
	};

	// Delete selected control point
	const handleDeleteSelected = () => {
		if (selectedPointIndex !== null) {
			const updatedPoints = [...controlPoints];
			updatedPoints.splice(selectedPointIndex, 1);
			setControlPoints(updatedPoints);
			setSelectedPointIndex(null);
		}
	};

	return (
		<div className="flex flex-col w-full max-w-full md:gap-4 p-0 md:p-4 bg-gray-900 md:rounded-lg md:shadow-lg">
			<div
				ref={containerRef}
				className="w-full overflow-hidden bg-black md:rounded-lg shadow-inner"
				style={{ height: canvasSize.height }}
			>
				<canvas
					ref={canvasRef}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerLeave={handlePointerUp}
					className="touch-none"
				/>
			</div>

			<div className="p-3 sm:p-4 bg-gray-800 md:rounded-lg md:shadow-md">
				<div className="flex flex-wrap gap-2 mb-4">
					<button
						type="button"
						onClick={handleClear}
						className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
					>
						Clear All Points
					</button>
					<button
						type="button"
						onClick={handleDeleteSelected}
						disabled={selectedPointIndex === null}
						className="px-4 py-2 text-sm font-medium text-white transition-colors bg-orange-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800"
					>
						Delete Selected Point
					</button>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-2">
						<label className="block">
							<span className="block mb-1 text-sm font-medium text-gray-300">
								Curve Degree: {curveDegree}
							</span>
							<input
								type="range"
								min="1"
								max="5"
								value={curveDegree}
								onChange={handleDegreeChange}
								className="w-full h-2 bg-gray-700 md:rounded-lg appearance-none cursor-pointer"
							/>
						</label>
					</div>

					<div className="space-y-2">
						<label className="block">
							<span className="block mb-1 text-sm font-medium text-gray-300">
								Curve Resolution: {curveResolution}
							</span>
							<input
								type="range"
								min="10"
								max="200"
								value={curveResolution}
								onChange={handleResolutionChange}
								className="w-full h-2 bg-gray-700 md:rounded-lg appearance-none cursor-pointer"
							/>
						</label>
					</div>

					{selectedPointIndex !== null && (
						<div className="md:col-span-2">
							<label className="block">
								<span className="block mb-1 text-sm font-medium text-gray-300">
									Selected Point Weight: {selectedWeight.toFixed(2)}
								</span>
								<input
									type="range"
									min="0.1"
									max="5"
									step="0.1"
									value={selectedWeight}
									onChange={handleWeightChange}
									className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
								/>
							</label>
						</div>
					)}
				</div>
			</div>

			<div className="p-3 text-sm text-center text-gray-300 bg-gray-800 md:rounded-lg">
				{!wasmLoaded ? (
					<p className="font-medium text-blue-400">Loading WASM module...</p>
				) : (
					<p>
						Control Points:{" "}
						<span className="font-medium text-green-400">
							{controlPoints.length}
						</span>{" "}
						|
						{controlPoints.length < curveDegree + 1 ? (
							<span className="font-medium text-yellow-400">
								{" "}
								Need at least {curveDegree + 1} points for a degree{" "}
								{curveDegree} curve
							</span>
						) : (
							<span className="font-medium text-green-400">
								{" "}
								Curve is ready
							</span>
						)}
					</p>
				)}
			</div>
		</div>
	);
}

export default Editor;
