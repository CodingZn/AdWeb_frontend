import { Group, Mesh, Object3D, Texture, Vector3, MeshBasicMaterial } from "three";

export interface Position { 
  x?: number, 
  y?: number, 
  z?: number 
}
export interface IRenderable extends Position {
  name?: string,
  color?: string,
}

export interface ITransformType {
  scaleX?: number,
  scaleY?: number,
  scaleZ?: number,
  rotateX?: number,
  rotateY?: number,
  rotateZ?: number,
  translateX?: number,
  translateY?: number,
  translateZ?: number,
}

export interface IRenderableDefault extends IRenderable, Position {
  name: string,
  color: string,
  x: number, 
  y: number, 
  z: number 
}

export const defaultRenderableParams: IRenderableDefault = {
  name: '',
  x: 0,
  y: 0,
  z: 0,
  color: '#ffffff',
}

export class Renderable {
  public object: Object3D;
  protected state: IRenderableDefault = defaultRenderableParams;

  constructor(params?: IRenderable) {
    this.object = new Group();
    if (params !== undefined) {
      this.update(params);
    }
  }

  public update(params: IRenderable) {
    return this._update(params);
  }

  public transform(transform: ITransformType) {
    Object.keys(transform).forEach(type => {
      const arg = transform[type as keyof ITransformType] as number;
      let fn;
      if (this.object[type as keyof Object3D] !== undefined) {
        fn = (this.object[type as keyof Object3D] as (arg: number) => any);
        fn = fn.bind(this.object);
        fn(arg);
      } else {
        return;
      }
    })
    // 特殊处理 scale
    const scale = new Vector3().copy(this.object.scale);
    for (let d of ['x', 'y', 'z']) {
      let v = transform[`scale${d.toUpperCase()}` as keyof ITransformType];
      if (v === undefined) v = 1;
      const vold = scale[d as keyof Vector3] as number;
      scale[d as keyof Position] = v * vold;
    }
    this.object.scale.copy(scale);
    return this;
  }

  public add(renderable: Renderable | Object3D) {
    if (renderable instanceof Renderable) {
      this.object.add(renderable.object);
    } else {
      this.object.add(renderable as Object3D);
    }
    return this;
  }

  public onLoad(resources: any[]) {
    const self = this;
    const objects: Object3D[] = [];
    let texture: Texture | undefined;
    resources.forEach((res: any) => {
      if (res.isObject3D) {
        objects.push(res);
      } else if (res.isTexture) {
        texture = res;
      }
    })

    objects.forEach(object => {
      self.add(object);
    })

    this.object.traverse((child: Object3D) => {
      if ( (child as any).isMesh ) {
        const mesh = child as Mesh;
        const material = mesh.material as MeshBasicMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (texture !== undefined) {
          material.map = texture;
        }
      }
    });
    return this;
  }

  protected _update(params: IRenderable) {
    const newState = Object.assign(this.state, params);
    const { name, x, y, z, color } = newState;
    this.state = newState;
    this.object.position.set(x, y, z);
    this.object.name = name;
    this.object.traverse(child => {
      // todo 修改子

    })
    
    return this;
  }
}