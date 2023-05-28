import { Group, Mesh, Object3D, Texture, Vector3, MeshBasicMaterial } from "three";

export interface IRenderable {
  name?: string,
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
  scale?: [number, number, number],
  rotateX?: number,
  rotateY?: number,
  rotateZ?: number,
  translateX?: number,
  translateY?: number,
  translateZ?: number,
}

export interface IRenderableDefault extends IRenderable {
  name: string,
  width: number,
  height: number,
  depth: number,
  color: string,
  x: number,
  y: number,
  z: number,
}

const defaultParams: IRenderableDefault = {
  name: '',
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
  private state: IRenderableDefault = defaultParams;

  constructor(params?: IRenderable) {
    this.object = new Group();
    this.update(params);
  }

  public update(params?: IRenderable) {
    const newState = Object.assign(this.state, params);
    const { name, x, y, z, width, height, depth, color, transform } = newState;
    this.state = newState;
    this.object.position.set(x, y, z);
    this.object.name = name;
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
    return this;
  }

  public transform(transform: ITransformType) {
    return this.update({ transform });
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
    console.log('onload', resources);
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
        child.castShadow = true;
        child.receiveShadow = true;
        if (texture !== undefined) {
          (mesh.material as MeshBasicMaterial).map = texture;
        }
      }
    });
    return this;
  }
}