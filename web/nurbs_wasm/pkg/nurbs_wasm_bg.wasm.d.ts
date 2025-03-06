/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const __wbg_controlpoint_free: (a: number, b: number) => void;
export const controlpoint_new: (a: number, b: number, c: number) => number;
export const controlpoint_x: (a: number) => number;
export const controlpoint_y: (a: number) => number;
export const controlpoint_weight: (a: number) => number;
export const controlpoint_set_x: (a: number, b: number) => void;
export const controlpoint_set_y: (a: number, b: number) => void;
export const controlpoint_set_weight: (a: number, b: number) => void;
export const __wbg_nurbscurve_free: (a: number, b: number) => void;
export const nurbscurve_new: (a: number) => number;
export const nurbscurve_add_control_point: (a: number, b: number) => void;
export const nurbscurve_set_knots: (a: number, b: number, c: number) => void;
export const nurbscurve_evaluate: (a: number, b: number) => number;
export const nurbscurve_generate_points: (a: number, b: number) => [number, number];
export const nurbscurve_num_control_points: (a: number) => number;
export const nurbscurve_get_control_point: (a: number, b: number) => number;
export const nurbscurve_update_control_point: (a: number, b: number, c: number, d: number, e: number) => number;
export const nurbscurve_get_degree: (a: number) => number;
export const generate_nurbs_curve_points: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_export_3: WebAssembly.Table;
export const __externref_drop_slice: (a: number, b: number) => void;
export const __wbindgen_start: () => void;
