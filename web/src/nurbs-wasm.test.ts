import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	ControlPoint,
	NurbsCurve,
	generate_nurbs_curve_points,
} from "./test/mocks/nurbs_wasm";

// Mock the WASM module
vi.mock("nurbs_wasm", () => {
	return import("./test/mocks/nurbs_wasm");
});

describe("NURBS WASM Module", () => {
	describe("ControlPoint", () => {
		it("creates a control point with correct properties", () => {
			const point = new ControlPoint(10, 20, 2);
			expect(point.x).toBe(10);
			expect(point.y).toBe(20);
			expect(point.weight).toBe(2);
		});

		it("allows updating properties", () => {
			const point = new ControlPoint(10, 20, 2);

			point.set_x(15);
			point.set_y(25);
			point.set_weight(3);

			expect(point.x).toBe(15);
			expect(point.y).toBe(25);
			expect(point.weight).toBe(3);
		});
	});

	describe("NurbsCurve", () => {
		let curve: NurbsCurve;

		beforeEach(() => {
			curve = new NurbsCurve(3); // Create a degree 3 curve
		});

		it("initializes with correct degree", () => {
			expect(curve.get_degree()).toBe(3);
		});

		it("starts with no control points", () => {
			expect(curve.num_control_points()).toBe(0);
		});

		it("can add control points", () => {
			const point = new ControlPoint(10, 20, 1);
			curve.add_control_point(point);

			expect(curve.num_control_points()).toBe(1);

			const retrievedPoint = curve.get_control_point(0);
			expect(retrievedPoint).not.toBeNull();
			if (retrievedPoint) {
				expect(retrievedPoint.x).toBe(10);
				expect(retrievedPoint.y).toBe(20);
				expect(retrievedPoint.weight).toBe(1);
			}
		});

		it("can update control points", () => {
			// Add a point first
			curve.add_control_point(new ControlPoint(10, 20, 1));

			// Update the point
			const success = curve.update_control_point(0, 15, 25, 2);
			expect(success).toBe(true);

			// Verify the update
			const point = curve.get_control_point(0);
			expect(point).not.toBeNull();
			if (point) {
				expect(point.x).toBe(15);
				expect(point.y).toBe(25);
				expect(point.weight).toBe(2);
			}
		});

		it("returns false when updating non-existent control point", () => {
			const success = curve.update_control_point(0, 15, 25, 2);
			expect(success).toBe(false);
		});

		it("generates points along the curve", () => {
			// Add control points to define a curve
			curve.add_control_point(new ControlPoint(0, 0, 1));
			curve.add_control_point(new ControlPoint(10, 10, 1));
			curve.add_control_point(new ControlPoint(20, 0, 1));
			curve.add_control_point(new ControlPoint(30, 10, 1));

			// Generate points
			const points = curve.generate_points(5);

			// Verify we got the expected number of points
			expect(points.length).toBe(5);

			// First point should be at the first control point
			expect(points[0]?.x).toBe(0);
			expect(points[0]?.y).toBe(0);

			// Last point should be at the last control point
			expect(points[4]?.x).toBe(30);
			expect(points[4]?.y).toBe(10);
		});
	});

	describe("generate_nurbs_curve_points", () => {
		it("generates a flat array of points", () => {
			const controlPointsX = new Float64Array([0, 10, 20]);
			const controlPointsY = new Float64Array([0, 10, 0]);
			const weights = new Float64Array([1, 1, 1]);

			const result = generate_nurbs_curve_points(
				controlPointsX,
				controlPointsY,
				weights,
				2, // degree
				3, // number of points
			);

			// Should return a flat array [x1, y1, x2, y2, x3, y3]
			expect(result.length).toBe(6);

			// First point should be at the first control point
			expect(result[0]).toBe(0);
			expect(result[1]).toBe(0);

			// Last point should be at the last control point
			expect(result[4]).toBe(20);
			expect(result[5]).toBe(0);
		});
	});
});
