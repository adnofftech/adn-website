import { T } from "./durable_kit.js";
export const T16 = {};
export function buildS16(root) { const g = new T.Group(); root.add(g); return { g }; }
export function updateS16() {}
export const S16_LIGHTS = () => ({ hemiC: 0xffffff, hemiG: 0x222222, hemi: 1, dirC: 0xffffff, dir: 1, dirP: [0, 10, 10], ptC: 0xffffff, ptP: [0, 5, 5], pt: 0 });
export const S16_ENV = () => ({ bg: 0x030605, fog: 0.01 });
export const S16_SHAKE = () => 0;
