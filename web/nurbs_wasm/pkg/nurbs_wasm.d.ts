/* tslint:disable */
/* eslint-disable */
export function generate_nurbs_curve_points(control_points_x: Float64Array, control_points_y: Float64Array, weights: Float64Array, degree: number, num_points: number): Float64Array;
export class ControlPoint {
  free(): void;
  constructor(x: number, y: number, weight: number);
  x: number;
  y: number;
  weight: number;
}
export class NurbsCurve {
  free(): void;
  constructor(degree: number);
  add_control_point(control_point: ControlPoint): void;
  set_knots(knots: Float64Array): void;
  evaluate(u: number): ControlPoint | undefined;
  generate_points(num_points: number): ControlPoint[];
  num_control_points(): number;
  get_control_point(index: number): ControlPoint | undefined;
  update_control_point(index: number, x: number, y: number, weight: number): boolean;
  get_degree(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_controlpoint_free: (a: number, b: number) => void;
  readonly controlpoint_new: (a: number, b: number, c: number) => number;
  readonly controlpoint_x: (a: number) => number;
  readonly controlpoint_y: (a: number) => number;
  readonly controlpoint_weight: (a: number) => number;
  readonly controlpoint_set_x: (a: number, b: number) => void;
  readonly controlpoint_set_y: (a: number, b: number) => void;
  readonly controlpoint_set_weight: (a: number, b: number) => void;
  readonly __wbg_nurbscurve_free: (a: number, b: number) => void;
  readonly nurbscurve_new: (a: number) => number;
  readonly nurbscurve_add_control_point: (a: number, b: number) => void;
  readonly nurbscurve_set_knots: (a: number, b: number, c: number) => void;
  readonly nurbscurve_evaluate: (a: number, b: number) => number;
  readonly nurbscurve_generate_points: (a: number, b: number) => [number, number];
  readonly nurbscurve_num_control_points: (a: number) => number;
  readonly nurbscurve_get_control_point: (a: number, b: number) => number;
  readonly nurbscurve_update_control_point: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly nurbscurve_get_degree: (a: number) => number;
  readonly generate_nurbs_curve_points: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
