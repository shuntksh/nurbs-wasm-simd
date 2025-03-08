use wasm_bindgen::prelude::*;
use std::vec::Vec;
use std::f64;

// When the `dlmalloc` feature is enabled, use `dlmalloc` as the global allocator.
#[cfg(feature = "dlmalloc")]
#[global_allocator]
static ALLOC: dlmalloc::GlobalDlmalloc = dlmalloc::GlobalDlmalloc;

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
    // Standard implementation for better accuracy
    fn calculate_basis_functions(&self, span: usize, u: f64) -> Vec<f64> {
        // Safety check: ensure we have enough knots
        if span + self.degree >= self.knots.len() || span < self.degree {
            return vec![0.0; self.degree + 1];
        }
        
        let mut basis = vec![0.0; self.degree + 1];
        let mut left = vec![0.0; self.degree + 1];
        let mut right = vec![0.0; self.degree + 1];
        
        basis[0] = 1.0;
        
        // Standard Cox-de Boor recursion formula implementation
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
    // Standard implementation for better accuracy
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
        
        // Standard evaluation of NURBS curve point
        let mut numerator_x = 0.0;
        let mut numerator_y = 0.0;
        let mut denominator = 0.0;
        
        // Process all control points that influence this span
        for i in 0..=self.degree {
            let control_point_idx = span - self.degree + i;
            
            // Skip if index is out of bounds
            if control_point_idx >= self.control_points.len() {
                continue;
            }
            
            let control_point = &self.control_points[control_point_idx];
            let weight = control_point.weight;
            let basis_value = basis[i];
            let weighted_basis = basis_value * weight;
            
            numerator_x += weighted_basis * control_point.x;
            numerator_y += weighted_basis * control_point.y;
            denominator += weighted_basis;
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
    // SIMD-optimized version for better performance
    pub fn generate_points(&self, num_points: usize) -> Vec<ControlPoint> {
        let mut points = Vec::with_capacity(num_points);
        
        if self.control_points.len() < self.degree + 1 || self.knots.is_empty() {
            return points;
        }
        
        // Ensure we have at least 2 points for interpolation
        let actual_num_points = if num_points < 2 { 2 } else { num_points };
        
        // Pre-allocate the points vector
        points.resize(actual_num_points, ControlPoint::new(0.0, 0.0, 1.0));
        
        // Calculate step size
        let step = 1.0 / (actual_num_points as f64 - 1.0);
        
        // Process points sequentially for better accuracy
        for i in 0..actual_num_points {
            // Calculate parameter value
            let u = if i == actual_num_points - 1 {
                1.0 // Ensure the last point is exactly at u=1.0
            } else {
                i as f64 * step
            };
            
            // Try to evaluate the point at parameter u
            match self.evaluate(u) {
                Some(point) => points[i] = point,
                None => {
                    // If evaluation fails, create a fallback point
                    if !self.control_points.is_empty() {
                        // Use the first control point as a fallback
                        points[i] = self.control_points[0].clone();
                    } else {
                        // If there are no control points, create a default point at origin
                        points[i] = ControlPoint::new(0.0, 0.0, 1.0);
                    }
                }
            }
        }
        
        // This section is no longer needed as we're processing all points sequentially above
        
        // Ensure the last point is exactly at u=1.0
        if actual_num_points > 0 {
            match self.evaluate(1.0) {
                Some(point) => points[actual_num_points - 1] = point,
                None => {
                    // If evaluation fails, use the last control point as fallback
                    if !self.control_points.is_empty() {
                        points[actual_num_points - 1] = self.control_points.last().unwrap().clone();
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
// Standard implementation for better accuracy
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
    
    // Add control points sequentially for better reliability
    let num_control_points = control_points_x.len().min(control_points_y.len()).min(weights.len());
    
    // Add each control point individually
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
    
    // Pre-allocate the result vector
    result.resize(points.len() * 2, 0.0);
    
    // Process points sequentially for better reliability
    for i in 0..points.len() {
        let result_idx = i * 2;
        result[result_idx] = points[i].x;
        result[result_idx + 1] = points[i].y;
    }
    
    result.into_boxed_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_control_point_creation() {
        let point = ControlPoint::new(1.0, 2.0, 3.0);
        assert_eq!(point.x(), 1.0);
        assert_eq!(point.y(), 2.0);
        assert_eq!(point.weight(), 3.0);
    }

    #[test]
    fn test_control_point_setters() {
        let mut point = ControlPoint::new(1.0, 2.0, 3.0);
        point.set_x(4.0);
        point.set_y(5.0);
        point.set_weight(6.0);
        assert_eq!(point.x(), 4.0);
        assert_eq!(point.y(), 5.0);
        assert_eq!(point.weight(), 6.0);
    }

    #[test]
    fn test_nurbs_curve_creation() {
        let curve = NurbsCurve::new(3);
        assert_eq!(curve.get_degree(), 3);
        assert_eq!(curve.num_control_points(), 0);
    }

    #[test]
    fn test_add_control_point() {
        let mut curve = NurbsCurve::new(3);
        let point = ControlPoint::new(1.0, 2.0, 3.0);
        curve.add_control_point(point);
        assert_eq!(curve.num_control_points(), 1);
        
        let retrieved_point = curve.get_control_point(0).unwrap();
        assert_eq!(retrieved_point.x(), 1.0);
        assert_eq!(retrieved_point.y(), 2.0);
        assert_eq!(retrieved_point.weight(), 3.0);
    }

    #[test]
    fn test_update_control_point() {
        let mut curve = NurbsCurve::new(3);
        curve.add_control_point(ControlPoint::new(1.0, 2.0, 3.0));
        
        let success = curve.update_control_point(0, 4.0, 5.0, 6.0);
        assert!(success);
        
        let point = curve.get_control_point(0).unwrap();
        assert_eq!(point.x(), 4.0);
        assert_eq!(point.y(), 5.0);
        assert_eq!(point.weight(), 6.0);
        
        // Test updating non-existent point
        let failure = curve.update_control_point(1, 7.0, 8.0, 9.0);
        assert!(!failure);
    }

    #[test]
    fn test_evaluate_simple_curve() {
        let mut curve = NurbsCurve::new(1); // Linear curve
        curve.add_control_point(ControlPoint::new(0.0, 0.0, 1.0));
        curve.add_control_point(ControlPoint::new(10.0, 10.0, 1.0));
        
        // Evaluate at u=0.0 (should be first control point)
        let point_start = curve.evaluate(0.0).unwrap();
        assert_eq!(point_start.x(), 0.0);
        assert_eq!(point_start.y(), 0.0);
        
        // Evaluate at u=1.0 (should be last control point)
        let point_end = curve.evaluate(1.0).unwrap();
        assert_eq!(point_end.x(), 10.0);
        assert_eq!(point_end.y(), 10.0);
        
        // Evaluate at u=0.5 (should be midpoint for linear curve)
        let point_mid = curve.evaluate(0.5).unwrap();
        assert_eq!(point_mid.x(), 5.0);
        assert_eq!(point_mid.y(), 5.0);
    }

    #[test]
    fn test_generate_points() {
        let mut curve = NurbsCurve::new(1); // Linear curve
        curve.add_control_point(ControlPoint::new(0.0, 0.0, 1.0));
        curve.add_control_point(ControlPoint::new(10.0, 10.0, 1.0));
        
        let points = curve.generate_points(3);
        assert_eq!(points.len(), 3);
        
        // First point should be at u=0.0
        assert_eq!(points[0].x(), 0.0);
        assert_eq!(points[0].y(), 0.0);
        
        // Last point should be at u=1.0
        assert_eq!(points[2].x(), 10.0);
        assert_eq!(points[2].y(), 10.0);
    }

    #[test]
    fn test_weighted_control_points() {
        let mut curve = NurbsCurve::new(1); // Linear curve
        curve.add_control_point(ControlPoint::new(0.0, 0.0, 1.0));
        curve.add_control_point(ControlPoint::new(10.0, 10.0, 2.0)); // Higher weight pulls curve toward this point
        
        // At u=0.5, point should be closer to the second control point due to higher weight
        let point = curve.evaluate(0.5).unwrap();
        assert!(point.x() > 5.0); // Should be pulled toward second point (x > 5.0)
        assert!(point.y() > 5.0); // Should be pulled toward second point (y > 5.0)
    }

    #[test]
    fn test_helper_function() {
        let control_points_x = vec![0.0, 10.0];
        let control_points_y = vec![0.0, 10.0];
        let weights = vec![1.0, 1.0];
        
        let result = generate_nurbs_curve_points(
            &control_points_x,
            &control_points_y,
            &weights,
            1, // Linear curve
            3  // 3 points
        );
        
        assert_eq!(result.len(), 6); // 3 points * 2 coordinates
        
        // First point (x,y) = (0,0)
        assert_eq!(result[0], 0.0);
        assert_eq!(result[1], 0.0);
        
        // Last point (x,y) = (10,10)
        assert_eq!(result[4], 10.0);
        assert_eq!(result[5], 10.0);
    }
}
