import { Group, Object3D, Vector3 } from "three";

export interface IRenderable {
  width?: number,
  height?: number,
  depth?: number,
  color?: string,
  x?: number,
  y?: number,
  z?: number,
  transform?: ITransformType
}

export interface ITransformType {
  translate?: [number, number, number],
  scale?: [number, number, number],
  rotateX?: number,
  rotateY?: number,
  rotateZ?: number,
}

export interface IRenderableDefault extends IRenderable {
  width: number,
  height: number,
  depth: number,
  color: string,
  x: number,
  y: number,
  z: number,
}

const defaultParams: IRenderableDefault = {
  x: 0,
  y: 0,
  z: 0,
  width: 0,
  height: 0,
  depth: 0,
  color: '#ffffff',
}

export class Renderable {
  public object: Object3D;
 
  public static getParams(params: IRenderable) {
    return Object.assign(defaultParams, params) as IRenderableDefault;
  }

  constructor(params?: IRenderable) {
    this.object = new Group();
    this.update(params);
  }

  public update(params?: IRenderable) {
    const { x, y, z, width, height, depth, color, transform } = Renderable.getParams(params || {});
    this.object.position.set(x, y, z);
    this.object.traverse(child => {
      // todo 修改子

    })
    if (transform !== undefined) {
      Object.keys(transform).forEach(type => {
        const args = transform[type as keyof ITransformType];
        const self = this.object[type as keyof Object3D];
        if (Array.isArray(args)) {
          
          const fn = (self as Vector3).set.bind(self) as (...args: any) => any;        
          fn(...args);
        } else {
          const fn = (self as (arg: any) => any).bind(this.object);
          fn(args);
        }
      })
    }
  }

  public transform(transform: ITransformType) {
    this.update({ transform });
  }

  public add(renderable: Renderable | Object3D) {
    if (renderable instanceof Renderable) {
      this.object.add(renderable.object);
    } else {
      this.object.add(renderable as Object3D);
    }
  }
}