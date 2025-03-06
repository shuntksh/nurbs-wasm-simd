use wasm_bindgen::prelude::*;
use std::vec::Vec;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Enable better error messages in debug mode
#[cfg(feature = "console_error_panic_hook")]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

// Define a struct to represent a control point with its weight
#[wasm_bindgen]
#[derive(Clone, Debug)]
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

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.x
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.y
    }

    #[wasm_bindgen(getter)]
    pub fn weight(&self) -> f64 {
        self.weight
    }

    #[wasm_bindgen(setter)]
    pub fn set_x(&mut self, x: f64) {
        self.x = x;
    }

    #[wasm_bindgen(setter)]
    pub fn set_y(&mut self, y: f64) {
        self.y = y;
    }

    #[wasm_bindgen(setter)]
    pub fn set_weight(&mut self, weight: f64) {
        self.weight = weight;
    }
}

// Define the NURBS curve generator
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

    // Add a control point to the curve
    pub fn add_control_point(&mut self, control_point: ControlPoint) {
        self.control_points.push(control_point);
        self.update_knots();
    }

    // Set the knot vector manually
    pub fn set_knots(&mut self, knots: Vec<f64>) {
        self.knots = knots;
    }

    // Generate a uniform knot vector
    fn update_knots(&mut self) {
        // Safety check: ensure we have at least one control point
        if self.control_points.is_empty() {
            self.knots = vec![0.0, 1.0]; // Default knot vector
            return;
        }
        
        let n = self.control_points.len() - 1;
        
        // Safety check: ensure degree is not too large for the number of control points
        if self.degree > n {
            // Adjust degree to be at most n
            // This is just for knot generation, we don't actually change the curve's degree
            let effective_degree = n;
            let m = n + effective_degree + 1;
            
            let mut knots = Vec::with_capacity(m + 1);
            
            // For a clamped knot vector
            for i in 0..=m {
                let knot = if i < effective_degree {
                    0.0
                } else if i > n {
                    1.0
                } else {
                    let denom = (n - effective_degree + 1) as f64;
                    if denom < 1e-10 {
                        // Avoid division by zero
                        i as f64 / m as f64
                    } else {
                        (i - effective_degree) as f64 / denom
                    }
                };
                knots.push(knot);
            }
            
            self.knots = knots;
        } else {
            // Normal case: degree <= n
            let m = n + self.degree + 1;
            
            let mut knots = Vec::with_capacity(m + 1);
            
            // For a clamped knot vector
            for i in 0..=m {
                let knot = if i < self.degree {
                    0.0
                } else if i > n {
                    1.0
                } else {
                    let denom = (n - self.degree + 1) as f64;
                    if denom < 1e-10 {
                        // Avoid division by zero
                        i as f64 / m as f64
                    } else {
                        (i - self.degree) as f64 / denom
                    }
                };
                knots.push(knot);
            }
            
            self.knots = knots;
        }
    }

    // Find the knot span for a given parameter u
    fn find_span(&self, u: f64) -> Option<usize> {
        // Check if we have enough control points and knots
        if self.control_points.is_empty() || self.knots.len() < 2 {
            return None;
        }
        
        let n = self.control_points.len() - 1;
        
        // Ensure we have enough knots for the degree
        if n + 1 >= self.knots.len() || self.degree >= self.knots.len() {
            return None;
        }
        
        // Clamp u to valid range
        let u = u.max(0.0).min(1.0);
        
        if u >= self.knots[n + 1] {
            return Some(n);
        }
        
        if u <= self.knots[self.degree] {
            return Some(self.degree);
        }
        
        let mut low = self.degree;
        let mut high = n + 1;
        
        // Safety check to prevent infinite loop
        let max_iterations = 100;
        let mut iterations = 0;
        
        let mut mid = (low + high) / 2;
        
        while (u < self.knots[mid] || u >= self.knots[mid + 1]) && iterations < max_iterations {
            if u < self.knots[mid] {
                high = mid;
            } else {
                low = mid;
            }
            mid = (low + high) / 2;
            iterations += 1;
        }
        
        // If we hit max iterations, return a safe value
        if iterations >= max_iterations {
            return Some(self.degree);
        }
        
        Some(mid)
    }

    // Calculate the basis functions for a given parameter u and span
    fn calculate_basis_functions(&self, span: usize, u: f64) -> Vec<f64> {
        // Safety check: ensure we have enough knots
        if span + self.degree >= self.knots.len() || span < self.degree {
            return vec![0.0; self.degree + 1];
        }
        
        let mut basis = vec![0.0; self.degree + 1];
        let mut left = vec![0.0; self.degree + 1];
        let mut right = vec![0.0; self.degree + 1];
        
        basis[0] = 1.0;
        
        for j in 1..=self.degree {
            // Safety check: ensure indices are valid
            if span + 1 < j || span + j >= self.knots.len() {
                continue;
            }
            
            left[j] = u - self.knots[span + 1 - j];
            right[j] = self.knots[span + j] - u;
            
            let mut saved = 0.0;
            
            for r in 0..j {
                // Avoid division by zero
                let divisor = right[r + 1] + left[j - r];
                let temp = if divisor.abs() < 1e-10 {
                    0.0
                } else {
                    basis[r] / divisor
                };
                
                basis[r] = saved + right[r + 1] * temp;
                saved = left[j - r] * temp;
            }
            
            basis[j] = saved;
        }
        
        basis
    }

    // Evaluate the NURBS curve at parameter u
    pub fn evaluate(&self, u: f64) -> Option<ControlPoint> {
        if self.control_points.is_empty() || self.knots.is_empty() {
            return None;
        }
        
        // Find the knot span for parameter u
        let span = match self.find_span(u) {
            Some(span) => span,
            None => return None, // Return None if we couldn't find a valid span
        };
        
        // Safety check: ensure we have enough control points for the calculation
        if span < self.degree || span >= self.control_points.len() {
            return None;
        }
        
        // Calculate basis functions
        let basis = self.calculate_basis_functions(span, u);
        
        let mut numerator_x = 0.0;
        let mut numerator_y = 0.0;
        let mut denominator = 0.0;
        
        // Safety check: ensure we don't go out of bounds
        for i in 0..=self.degree {
            let control_point_idx = span - self.degree + i;
            
            // Skip if index is out of bounds
            if control_point_idx >= self.control_points.len() {
                continue;
            }
            
            let control_point = &self.control_points[control_point_idx];
            let weight = control_point.weight;
            let basis_value = basis[i];
            
            numerator_x += basis_value * weight * control_point.x;
            numerator_y += basis_value * weight * control_point.y;
            denominator += basis_value * weight;
        }
        
        // Avoid division by zero
        if denominator.abs() < 1e-10 {
            return None;
        }
        
        Some(ControlPoint::new(
            numerator_x / denominator,
            numerator_y / denominator,
            1.0, // The evaluated point has a weight of 1.0
        ))
    }

    // Generate points along the curve for rendering
    pub fn generate_points(&self, num_points: usize) -> Vec<ControlPoint> {
        let mut points = Vec::with_capacity(num_points);
        
        if self.control_points.len() < self.degree + 1 || self.knots.is_empty() {
            return points;
        }
        
        // Ensure we have at least 2 points for interpolation
        let actual_num_points = if num_points < 2 { 2 } else { num_points };
        let step = 1.0 / (actual_num_points as f64 - 1.0);
        
        for i in 0..actual_num_points {
            let u = if i == actual_num_points - 1 {
                1.0
            } else {
                i as f64 * step
            };
            
            // Try to evaluate the point at parameter u
            match self.evaluate(u) {
                Some(point) => points.push(point),
                None => {
                    // If evaluation fails, create a fallback point
                    // This ensures we don't return null points to JavaScript
                    if !self.control_points.is_empty() {
                        // Use the first control point as a fallback
                        let fallback = self.control_points[0].clone();
                        points.push(fallback);
                    } else {
                        // If there are no control points, create a default point at origin
                        points.push(ControlPoint::new(0.0, 0.0, 1.0));
                    }
                }
            }
        }
        
        points
    }

    // Get the number of control points
    pub fn num_control_points(&self) -> usize {
        self.control_points.len()
    }

    // Get a control point by index
    pub fn get_control_point(&self, index: usize) -> Option<ControlPoint> {
        if index < self.control_points.len() {
            Some(self.control_points[index].clone())
        } else {
            None
        }
    }

    // Update a control point at a specific index
    pub fn update_control_point(&mut self, index: usize, x: f64, y: f64, weight: f64) -> bool {
        if index < self.control_points.len() {
            self.control_points[index] = ControlPoint::new(x, y, weight);
            true
        } else {
            false
        }
    }

    // Get the degree of the curve
    pub fn get_degree(&self) -> usize {
        self.degree
    }
}

// Helper function to create a JS array of points from Rust Vec
#[wasm_bindgen]
pub fn generate_nurbs_curve_points(
    control_points_x: &[f64],
    control_points_y: &[f64],
    weights: &[f64],
    degree: usize,
    num_points: usize
) -> Box<[f64]> {
    // Initialize panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    init_panic_hook();

    let mut curve = NurbsCurve::new(degree);
    
    // Add control points
    let num_control_points = control_points_x.len().min(control_points_y.len()).min(weights.len());
    for i in 0..num_control_points {
        curve.add_control_point(ControlPoint::new(
            control_points_x[i],
            control_points_y[i],
            weights[i]
        ));
    }
    
    // Generate points
    let points = curve.generate_points(num_points);
    
    // Convert to flat array [x1, y1, x2, y2, ...]
    let mut result = Vec::with_capacity(points.len() * 2);
    for point in points {
        result.push(point.x);
        result.push(point.y);
    }
    
    result.into_boxed_slice()
}
