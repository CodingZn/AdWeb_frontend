import { Material, Mesh, MeshLambertMaterial, Path, Shape, ShapeGeometry } from "three";
import { ISideParams, Side } from "./Box";
import { cachedMaterial } from "./cache";

export interface IWallParams extends ISideParams {
  windows?: IWindowParams[]
}

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IWindowParams extends IRect {}

/**
 * 墙的区别在于有窗
 *  y
 *  |
 *  |___________________ (width, height)
 *  |         ____      |
 *  |        |    |     |
 *  |        |    |     |
 *  |  (x, y)|____|     |
 *  |___________________|____ x     
 *          
 */

const rectPath = (rect: IRect, path: Path) => {
  const { width, height, x, y } = rect;
  path.moveTo(x + width, y + height);
  path.lineTo(x, y + height);
  path.lineTo(x, y);
  path.lineTo(x + width, y);
  return path;
}

export class Wall extends Side {
  protected geometry : ShapeGeometry;
  protected material : Material;

  constructor(params: IWallParams) { 
    super(params);
    const { width, height } = params;
    const color = params.color === undefined ? 0xffffff : params.color;
    this.remove(this.mesh);
    this.mesh.clear();
    const shape = rectPath({ x: 0, y: 0, width, height }, new Shape()) as Shape;
    for (const win of params.windows || []) {
      const hole = rectPath(win, new Path());
      shape.holes.push(hole);
    }
    this.geometry = new ShapeGeometry(shape);
    const materialCtor = params.material || MeshLambertMaterial;
    this.material = cachedMaterial(materialCtor, color);
    this.mesh = new Mesh(this.geometry, this.material);
    this.add(this.mesh);
  }
}