import { isFunction } from "lodash";
import { Group, Mesh, Object3D, Texture, Vector3, MeshBasicMaterial, Euler } from "three";
import { Disposable } from "./Disposable";

export interface IPosition { 
  x: number, 
  y: number, 
  z: number 
}

export interface IEuler {
  x: number, 
  y: number, 
  z: number 
}

export interface IRenderableParams {
  x?: number, 
  y?: number, 
  z?: number,
  name?: string,
  visible?: boolean,
  euler?: {
    x?: number, 
    y?: number, 
    z?: number,
  },
  isCollider?: boolean | ((child: Object3D) => boolean),
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

export interface IRenderableState extends IRenderableParams, IPosition {
  name: string,
  visible: boolean,
  x: number, 
  y: number, 
  z: number,
  euler: IEuler,
  isCollider?: boolean | ((child: Object3D) => boolean),
}

export const defaultRenderableParams: () => IRenderableState = () => ({
  name: '',
  x: 0,
  y: 0,
  z: 0,
  visible: true,
  euler: {
    x: 0,
    y: 0,
    z: 0
  },
  isCollider: false,
})

export abstract class Renderable extends Disposable {
  public object: Object3D;
  protected isCollider: boolean | ((child: Object3D) => boolean) = false; 
  private _name: string = '';
  private watchers: Map<string | number | symbol, (newState: IRenderableState, oldState: IRenderableState) => any> = new Map();

  constructor(params?: IRenderableParams) {
    super();
    this.object = new Group();
    if (params !== undefined) {
      this._update(defaultRenderableParams(), params);
    }
    const self = this;
    this._register({
      dispose: () => self.object.clear()
    })
  }

  public get uuid() { return this.object.uuid; }

  public get name() { return this._name; }

  public set name(v) { this._name = v; this.object.name = v; }

  public get state(): IRenderableState {
    const { 
      position: { x, y, z }, 
      rotation: { x: ex, y: ey, z: ez }, 
      visible 
    } = this.object;
    const { name, isCollider } = this;
    return { name, x, y, z, visible, euler: { x: ex, y: ey, z: ez }, isCollider };
  }

  public get parent() { return this.object.parent; }

  public get direction(): IPosition { return this.object.getWorldDirection(new Vector3()).normalize(); }

  public get colliders() {
    const { isCollider } = this;
    const colliders = new Set<Object3D>();
    this.object.traverse(child => {
      if (
        (child as Mesh).isMesh &&
        (isCollider === true || 
        (isFunction(isCollider) && isCollider(child)))
      ) { 
        colliders.add(child);
      }
    })
    return colliders;
  }

  public focus() {};

  public blur() {};

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

  public remove(renderable: Renderable | Object3D) {
    if (renderable instanceof Renderable) {
      this.object.remove(renderable.object);
    } else {
      this.object.remove(renderable as Object3D);
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
  public watch(name: string | number | symbol, cb: (newState: IRenderableState, oldState: IRenderableState) => any) {
    this.watchers.set(name, cb);
  }

  /**
   * 取消监听该物体的移动更新等操作
   * @param name 
   */
  public unwatch(name: string | number | symbol) {
    this.watchers.delete(name);
  }

  public follow(
    renderable: Renderable, 
    offset?: { x?: number, y?: number, z?: number} | ((state: IRenderableState) => IPosition), 
    lookAt?: (state: IRenderableState) => IPosition | any) {
    // 目前比较 trick 的做法：用一个不可视替身，作为被追踪者的孩子，从而维护相对坐标
    const { object } = this;
    const obj = new Object3D();
    obj.name = `substitute_for_${object.uuid}`;
    obj.visible = false;
    renderable.add(obj);
    object.userData['substitute'] = obj;
    const self = this;
    renderable.watch(object.uuid as string, (state: IRenderableState, oldState: IRenderableState) => {
      const { x: newX, y: newY, z: newZ } = state;
      const { x: sx, y: sy, z: sz  } = renderable.object.scale;
      if (isFunction(offset)) {
        const pos = offset(state);
        obj.position.set(pos.x, pos.y, pos.z);
      } else {
        // 距离是世界坐标系下的，所以先还原缩放
        obj.position.set(1 / sx * (offset?.x || 0), 1 / sy * (offset?.y || 0), 1 / sz * (offset?.z || 0));
      }
      renderable.parent?.add(object);
      const { x, y, z } = obj.getWorldPosition(new Vector3());
      self.update({ x, y, z });
      if (lookAt === undefined) {
        object.lookAt(newX, newY, newZ)
      } else {
        const { x, y, z } = lookAt(state);
        if (x !== undefined && y !== undefined && z !== undefined) {
          object.lookAt(x, y, z);
        }
      }
    })
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

  private _update(oldState: IRenderableState, state: IRenderableParams) {
    const newState = { ...oldState, ...state } as IRenderableState;
    const { 
      name, 
      x, y, z, 
      euler: { x: ex, y: ey, z: ez }, 
      isCollider,
      visible } = newState;
    this.object.position.set(x, y, z);
    this.object.quaternion.setFromEuler(new Euler(ex, ey, ez));
    this.name = name;
    this.isCollider = isCollider!;
    this.object.visible = visible;
    
    this.notify(oldState);
    return this;
  }

  private notify(oldState: IRenderableState) {
    this.watchers.forEach(cb => cb(this.state, oldState));
  }
}