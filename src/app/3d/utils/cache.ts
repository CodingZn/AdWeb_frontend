import { Constructor } from "src/app/utils/constructor";
import { BufferGeometry, DoubleSide, Material } from "three";

const materialCache = new Map<string, Material>();
export function cachedMaterial(ctor: Constructor, color: number | { [key: string]: any }) {
  const key = JSON.stringify({ ctor, color });
  let material = materialCache.get(key);
  if (material === undefined) {
    material = new ctor({ color, side: DoubleSide }) as Material;
    materialCache.set(key, material);
  }
  return material;
}

const geometryCache = new Map<string, BufferGeometry>();
export function cachedGeometry(ctor: Constructor, ...params: any[]) {
  const key = JSON.stringify({ ctor, params });
  let geo = geometryCache.get(key);
  if (geo === undefined) {
    geo = new ctor(...params) as BufferGeometry;
    geometryCache.set(key, geo);
  }
  return geo;
}