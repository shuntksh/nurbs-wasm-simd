declare module "nurbs_wasm" {
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
		update_control_point(
			index: number,
			x: number,
			y: number,
			weight: number,
		): boolean;
		get_degree(): number;
	}

	export function generate_nurbs_curve_points(
		control_points_x: Float64Array,
		control_points_y: Float64Array,
		weights: Float64Array,
		degree: number,
		num_points: number,
	): Float64Array;

	export function init_panic_hook(): void;
}
