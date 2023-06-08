import { Group, Mesh, Object3D, Texture, Vector3, MeshBasicMaterial, Euler } from "three";

export interface IPosition { 
  x: number, 
  y: number, 
  z: number 
}

export interface IEuler {
  x?: number, 
  y?: number, 
  z?: number 
}

export interface IRenderableParams {
  x?: number, 
  y?: number, 
  z?: number,
  name?: string,
  color?: string,
  visible?: boolean,
  euler?: IEuler
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

export interface IRenderable extends IRenderableParams, IPosition {
  name: string,
  visible: boolean,
  x: number, 
  y: number, 
  z: number,
  euler: IEuler
}

export const defaultRenderableParams: () => IRenderable = () => ({
  name: '',
  x: 0,
  y: 0,
  z: 0,
  color: '#ffffff',
  visible: true,
  euler: {
    x: 0,
    y: 0,
    z: 0
  }
})

export class Renderable {
  public object: Object3D;
  private name: string = '';
  private watchers: Map<string | number | symbol, (newState: IRenderable, oldState: IRenderable) => any> = new Map();

  constructor(params?: IRenderableParams) {
    this.object = new Group();
    if (params !== undefined) {
      this._update(defaultRenderableParams(), params);
    }
  }

  public get state(): IRenderable {
    const { 
      position: { x, y, z }, 
      rotation: { x: ex, y: ey, z: ez }, 
      visible 
    } = this.object;
    const { name } = this;
    return { name, x, y, z, visible, euler: { x: ex, y: ey, z: ez } };
  }

  public get parent() { return this.object.parent; }

  public get direction() { return this.object.getWorldDirection(new Vector3()).normalize(); }

  public update(params: IRenderableParams) {
    return this._update(this.state, params);
  }

  public transform(transform: ITransformType) {
    const oldState = this.state;
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
      scale[d as keyof IPosition] = v * vold;
    }
    this.object.scale.copy(scale);
    this.notify(oldState);
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

  public copy(renderable: Renderable) {
    this.update(renderable.state);
    this.object.applyMatrix4(renderable.object.matrix);
    const { watchers } = this;
    watchers.clear();
    renderable.watchers.forEach((value, key) => {
      watchers.set(key, value);
    })
    
  }

  /**
   * 监听该物体的移动更新等操作
   * @param name 
   * @param cb 
   */
  public watch(name: string | number | symbol, cb: (newState: IRenderable, oldState: IRenderable) => any) {
    this.watchers.set(name, cb);
  }

  /**
   * 取消监听该物体的移动更新等操作
   * @param name 
   */
  public unwatch(name: string | number | symbol) {
    this.watchers.delete(name);
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

  public destory() {
    this.watchers.clear();
    this.object.clear();
  }

  protected _update(oldState: IRenderable, state: IRenderableParams) {
    const newState = { ...oldState, ...state } as IRenderable;
    const { 
      name, 
      x, y, z, 
      euler: { x: ex, y: ey, z: ez }, 
      color, 
      visible } = newState;
    this.object.position.set(x, y, z);
    this.object.quaternion.setFromEuler(new Euler(ex, ey, ez));
    this.object.name = name;
    this.object.visible = visible;
    this.object.traverse(child => {
      // todo 修改子

    })
    this.notify(oldState);
    return this;
  }

  private notify(oldState: IRenderable) {
    this.watchers.forEach(cb => cb(this.state, oldState));
  }
}