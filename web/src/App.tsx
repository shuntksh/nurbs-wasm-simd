import { useEffect, useRef, useState } from 'react';
import initWasm, { ControlPoint, NurbsCurve } from '../nurbs_wasm/pkg/nurbs_wasm';

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
initWasm().then(() => {
  window.wasmModule = { ControlPoint, NurbsCurve };
  window.wasmInitialized = true;
  console.log('WASM module initialized successfully');
}).catch(err => {
  console.error('Failed to initialize WASM module:', err);
});

// Canvas dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Control point appearance
const CONTROL_POINT_RADIUS = 8;
const SELECTED_CONTROL_POINT_RADIUS = 10;
const CONTROL_POINT_COLOR = '#4CAF50';
const SELECTED_CONTROL_POINT_COLOR = '#FF5722';
const CURVE_COLOR = '#2196F3';
const CURVE_WIDTH = 2;

interface Point {
  x: number;
  y: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [curve, setCurve] = useState<NurbsCurve | null>(null);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [curveDegree, setCurveDegree] = useState(3);
  const [curveResolution, setCurveResolution] = useState(100);
  const [selectedWeight, setSelectedWeight] = useState(1.0);

  // Initialize WASM module
  useEffect(() => {
    async function loadWasm() {
      try {
        // Wait for the WASM module to be initialized
        if (!window.wasmInitialized) {
          console.log('Waiting for WASM module to initialize...');
          await new Promise<void>(resolve => {
            const checkModule = () => {
              if (window.wasmInitialized) {
                resolve();
              } else {
                setTimeout(checkModule, 100);
              }
            };
            checkModule();
          });
        }
        
        console.log('WASM module ready to use');
        
        // Create initial curve with degree 3
        const initialCurve = new NurbsCurve(3);
        console.log('Initial curve created successfully');
        
        // Set state
        setWasmLoaded(true);
        setCurve(initialCurve);
        setCurveDegree(3);
      } catch (error) {
        console.error('Failed to load WASM module:', error);
      }
    }
    
    loadWasm();
  }, []);

  // Update curve when control points or degree changes
  useEffect(() => {
    if (!wasmLoaded) {
      console.log('WASM not loaded yet, skipping curve update');
      return;
    }
    
    try {
      console.log(`Creating new curve with degree ${curveDegree}`);
      
      // Create a new curve with the current degree
      const newCurve = new NurbsCurve(curveDegree);
      console.log('New curve created successfully');
      
      // Only try to add control points if we have any
      if (controlPoints.length > 0) {
        console.log(`Adding ${controlPoints.length} control points to curve`);
        
        // Add each control point individually with error handling
        for (let i = 0; i < controlPoints.length; i++) {
          try {
            const point = controlPoints[i];
            
            // Skip null or invalid points
            if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.weight !== 'number') {
              console.log(`Skipping invalid control point at index ${i}`);
              continue;
            }
            
            console.log(`Adding control point ${i}: (${point.x}, ${point.y}, ${point.weight})`);
            
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
      console.log('Curve updated successfully');
    } catch (error) {
      console.error('Error updating curve:', error);
    }
  }, [wasmLoaded, controlPoints, curveDegree]);

  // Draw the curve and control points
  useEffect(() => {
    if (!canvasRef.current || !wasmLoaded || !curve) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw control points
    controlPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(
        point.x, 
        point.y, 
        index === selectedPointIndex ? SELECTED_CONTROL_POINT_RADIUS : CONTROL_POINT_RADIUS, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = index === selectedPointIndex ? SELECTED_CONTROL_POINT_COLOR : CONTROL_POINT_COLOR;
      ctx.fill();
      
      // Draw weight indicator (size of circle proportional to weight)
      ctx.beginPath();
      ctx.arc(
        point.x, 
        point.y, 
        CONTROL_POINT_RADIUS * point.weight * 0.5, 
        0, 
        Math.PI * 2
      );
      ctx.strokeStyle = 'white';
      ctx.stroke();
      
      // Draw index number
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index.toString(), point.x, point.y);
    });
    
    // Draw curve if we have enough control points
    if (controlPoints.length >= curveDegree + 1 && curve) {
      try {
        // Generate points with error handling
        const curvePoints = curve.generate_points(curveResolution);
        
        if (curvePoints && curvePoints.length > 0) {
          // Filter out any null points
          const validPoints = curvePoints.filter(point => point !== null && typeof point === 'object');
          
          if (validPoints.length > 0 && validPoints[0] && typeof validPoints[0].x === 'number' && typeof validPoints[0].y === 'number') {
            ctx.beginPath();
            ctx.moveTo(validPoints[0].x, validPoints[0].y);
            
            let hasValidPath = true;
            
            for (let i = 1; i < validPoints.length; i++) {
              if (validPoints[i] && typeof validPoints[i].x === 'number' && typeof validPoints[i].y === 'number') {
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
        console.error('Error generating or drawing curve points:', error);
      }
    }
    
    // Draw control polygon
    if (controlPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
      
      for (let i = 1; i < controlPoints.length; i++) {
        ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [wasmLoaded, curve, controlPoints, selectedPointIndex, curveResolution, curveDegree]);

  // Update selected weight when a control point is selected
  useEffect(() => {
    if (selectedPointIndex !== null && selectedPointIndex < controlPoints.length) {
      setSelectedWeight(controlPoints[selectedPointIndex].weight);
    }
  }, [selectedPointIndex, controlPoints]);

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !wasmLoaded || !curve) {
      console.log('Cannot handle mouse down: canvas, WASM, or curve not ready');
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log(`Mouse down at (${x}, ${y})`);
      
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
      console.log('Creating new control point');
      
      // Create a simple JavaScript object first
      const pointData = { x, y, weight: 1.0 };
      
      // Then create the ControlPoint from the object
      const newPoint = new ControlPoint(
        pointData.x,
        pointData.y,
        pointData.weight
      );
      
      console.log('New control point created successfully');
      
      // Create a new array with the new point
      const updatedPoints = [...controlPoints, newPoint];
      setControlPoints(updatedPoints);
      setSelectedPointIndex(updatedPoints.length - 1);
      
      console.log(`Added new point, total points: ${updatedPoints.length}`);
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
    }
  };

  // Handle mouse move on canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDragging || selectedPointIndex === null) return;
    
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
      const weight = typeof currentPoint.weight === 'number' ? currentPoint.weight : 1.0;
      
      // Create a new point with updated coordinates but same weight
      const newPoint = new ControlPoint(x, y, weight);
      updatedPoints[selectedPointIndex] = newPoint;
      
      setControlPoints(updatedPoints);
    } catch (error) {
      console.error('Error updating control point:', error);
    }
  };

  // Handle mouse up on canvas
  const handleMouseUp = () => {
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
        const x = typeof currentPoint.x === 'number' ? currentPoint.x : 0;
        const y = typeof currentPoint.y === 'number' ? currentPoint.y : 0;
        
        // Create a new point with the same coordinates but updated weight
        const newPoint = new ControlPoint(x, y, newWeight);
        updatedPoints[selectedPointIndex] = newPoint;
        
        setControlPoints(updatedPoints);
      }
    } catch (error) {
      console.error('Error updating control point weight:', error);
    }
  };

  // Handle degree change
  const handleDegreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newDegree = Number.parseInt(e.target.value, 10);
      setCurveDegree(newDegree);
    } catch (error) {
      console.error('Error updating curve degree:', error);
    }
  };

  // Handle resolution change
  const handleResolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newResolution = Number.parseInt(e.target.value, 10);
      setCurveResolution(newResolution);
    } catch (error) {
      console.error('Error updating curve resolution:', error);
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
    <div className="App">
      <h1>NURBS Curve Editor</h1>
      <p>Click on the canvas to add control points. Drag points to move them.</p>
      
      <div className="canvas-container" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      <div className="control-panel">
        <div className="control-group">
          <button type="button" onClick={handleClear}>Clear All Points</button>
          <button type="button" onClick={handleDeleteSelected} disabled={selectedPointIndex === null}>
            Delete Selected Point
          </button>
        </div>
        
        <div className="control-group">
          <label>
            Curve Degree: {curveDegree}
            <input
              type="range"
              min="1"
              max="5"
              value={curveDegree}
              onChange={handleDegreeChange}
            />
          </label>
        </div>
        
        <div className="control-group">
          <label>
            Curve Resolution: {curveResolution}
            <input
              type="range"
              min="10"
              max="200"
              value={curveResolution}
              onChange={handleResolutionChange}
            />
          </label>
        </div>
        
        {selectedPointIndex !== null && (
          <div className="control-group">
            <label>
              Selected Point Weight: {selectedWeight.toFixed(2)}
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={selectedWeight}
                onChange={handleWeightChange}
              />
            </label>
          </div>
        )}
      </div>
      
      <div className="status">
        {!wasmLoaded ? (
          <p>Loading WASM module...</p>
        ) : (
          <p>
            Control Points: {controlPoints.length} | 
            {controlPoints.length < curveDegree + 1 
              ? ` Need at least ${curveDegree + 1} points for a degree ${curveDegree} curve` 
              : ' Curve is ready'}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
