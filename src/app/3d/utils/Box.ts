import { Constructor } from "src/app/utils/constructor";
import { Mesh, MeshLambertMaterial, PlaneGeometry } from "three";
import { cachedGeometry, cachedMaterial } from "./cache";
import { IPosition, IRenderableParams, ITransformType, Renderable } from "./Renderable";

export interface IBoxParams extends IRenderableParams {
  width: number;
  height: number;
  depth: number;
  color?: number;
  sides?: {
    front?: IBoxSideConfig;
    back?: IBoxSideConfig;
    left?: IBoxSideConfig;
    right?: IBoxSideConfig;
    top?: IBoxSideConfig;
    bottom?: IBoxSideConfig;
  },
  material?: Constructor
}

interface IBoxSideConfig {
  if?: boolean,
  ctor?: Constructor<Side>;
  params?: IBoxSideParams;
}

interface IBoxSideParams {
  color?: number,
  [key: string]: any
}



/**
 *   y (height)
 *   |
 *   |________
 *   |\       \
 *   |_\_ top _\___  x (width)
 * O \  \_______\
 * left | front | 
 *     \|_______|
 *      \
 *       z (depth)
 */
const BOX_SIDES_CONSTANT_PARAMS: 
  (width: number, height: number, depth: number) => 
  { 
    [key: string]: {
      size: { width: number, height: number },
      position: IPosition,
      transform?: ITransformType
    }
  } 
= (width: number, height: number, depth: number) => ({
  front: {
    size: { width, height },
    position: { x: 0, y: 0, z: depth },
  },
  back: {
    size: { width, height },
    position: { x: 0, y: 0, z: 0 }
  },
  left: {
    size: { width: depth, height },
    position: { x: 0, y: 0, z: 0 },
    transform: { rotateY: - Math.PI / 2 }
  },
  right: {
    size: { width: depth, height },
    position: { x: width, y: 0, z: 0 },
    transform: { rotateY: - Math.PI / 2 }
  },
  top: {
    size: { width, height: depth },
    position: { x: 0, y: height, z: 0 },
    transform: { rotateX: Math.PI / 2 }
  },
  bottom: {
    size: { width, height: depth },
    position: { x: 0, y: 0, z: 0 },
    transform: { rotateX: Math.PI / 2 }
  }
});

export class Box extends Renderable {
  protected sideMap: Map<string, Side> = new Map();
  constructor(params: IBoxParams) {
    super(params);
    const { width, height, depth, material } = params;
    
    const CONSTANT_PARAMS = BOX_SIDES_CONSTANT_PARAMS(width, height, depth);
    for(const key in CONSTANT_PARAMS) {
      const sideConfig = (params.sides?.[key as keyof typeof params.sides] || {}) as IBoxSideConfig;
      if (sideConfig.if === false) {
        continue;
      }
      const Ctor = (sideConfig.ctor || Side) as any;
      const sideParams = sideConfig.params;
      // 某一面特定颜色 > 整体颜色 > 默认
      // 数字类型只能用 undefined 检验
      let color = 0xffffff;
      if (sideParams?.color !== undefined) {
        color = sideParams.color
      } else if (params.color !== undefined) {
        color = params.color
      }
      const { size, position, transform } = CONSTANT_PARAMS[key];
      const side = new Ctor({ name: key, color, material, ...size, ...position, ...sideParams }); 
      if (transform !== undefined) side.transform(transform);
      this.sideMap.set(key, side);
      this.add(side);
    }
  }
}

export interface ISideParams extends IRenderableParams {
  width: number;
  height: number;
  color?: number;
  material?: Constructor
}

/**
 *   y (height)
 *   |
 *   |________
 *   |        |
 *   |________|____  x (width)
 * O \ 
 *    \ 
 *     z 
 */
export class Side extends Renderable {
  protected mesh: Mesh;

  constructor(params: ISideParams) {
    super(params);
    const { width, height } = params;
    const geometry = cachedGeometry(PlaneGeometry, width, height)
    const color = params.color === undefined ? 0xffffff : params.color;
    const materialCtor = params.material || MeshLambertMaterial;
    const material = cachedMaterial(materialCtor, color);
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.set(width / 2, height / 2, 0);
    this.add(this.mesh);
  }
}