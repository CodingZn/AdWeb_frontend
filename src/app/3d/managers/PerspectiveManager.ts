import { cloneDeep } from "lodash";
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { IPosition, IRenderableState, Renderable } from "../utils/Renderable";
import { PerspectiveType } from "../views/View";

export interface IPerspectiveManagerOption {
  container?: HTMLElement,
  fov?: number,
  near?: number,
  far?: number,
}

export interface ICameraParams {
  x?: number, 
  y?: number,
  z?: number,
  parent?: Renderable,
  lookAt?: (state: IRenderableState) => IPosition | any
}

interface IState extends ICameraParams {
  x: number, 
  y: number,
  z: number,
}

const defaultOption: () => IPerspectiveManagerOption = () => ({
  container: document.body,
  fov: 45,
  near: 0.1,
  far: 200000
})

const defaultParams: () => IState = () => ({
  x: 0, 
  y: 0,
  z: 10,
})

export class PerspectiveManager {
  private options: IPerspectiveManagerOption;
  private activeName: string | symbol | null = null;
  private cameraMap: Map<string | symbol, PerspectiveCamera>;
  private cameraStateMap: Map<string | symbol, IState>;
  private _aspect: number = 1;

  constructor(options: IPerspectiveManagerOption) {
    this.options = Object.assign(defaultOption(), options);
    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
    this.cameraMap = new Map();
    this.cameraStateMap = new Map();
  }

  public get camera() {
    if (this.activeName === null) {
      return null;
    }
    return this.cameraMap.get(this.activeName) as PerspectiveCamera;
  }

  public get active() {
    return this.activeName;
  }

  /**
   * 
   * @param type 获取相机，若是第一次获取则创建一个
   * @param params 
   */
  public get(name: string | symbol, params?: ICameraParams) {
    let camera = this.cameraMap.get(name);
    let state: IState;
    if (camera === undefined) {
      const { options: { fov, near, far }, aspect } = this;
      // 创建相机和状态
      camera = new PerspectiveCamera(fov, aspect, near, far);    
      this.cameraMap.set(name, camera);
      state = Object.assign(defaultParams(), params);
      this.cameraStateMap.set(name, state);
    } else {
      state = Object.assign(this.cameraStateMap.get(name) as IState, params);
    }
    // 如果有需要跟随的物体，坐标以其为参照初始化
    if (params?.parent) {
      this._follow(name, params.parent, cloneDeep(state), params.lookAt);
    }
    this._update(name, state);
    return camera;
  }

  /**
   * 更新当前相机
   * @param params 
   * @returns 
   */
  public update(params: ICameraParams) {
    if (this.activeName === null) {
      console.warn('No active camera to update!');
      return;
    }
    this._update(this.activeName, params);
  }

  /**
   * 跟踪某个物体
   * @param renderable 
   * @param lookAt 可指定获取焦点的方式
   * @returns 
   */
  public follow(renderable: Renderable, lookAt?: (state: IRenderableState) => IPosition) {
    if (this.activeName === null) {
      console.warn('No active camera to follow!');
      return;
    }
    this._follow(this.activeName, renderable, { x: 0, y: 0, z: 0 }, lookAt);
  }

  /**
   * 取消跟踪某个物体
   * @param renderable 
   * @returns 
   */
  public unfollow(renderable: Renderable) {
    if (this.activeName === null) {
      console.warn('No active camera to unfollow!');
      return;
    }
    renderable.unwatch(this.camera?.uuid as string);
  }

  /**
   * 移动当前相机
   * @param params 
   */
  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    const { camera } = this;
    x && (camera?.translateX(x));
    y && (camera?.translateY(y));
    z && (camera?.translateZ(z));
  }

  /**
   * 
   * @param name 切换相机
   * @param params 
   */
  public switch(name: string | symbol | null, params?: ICameraParams) {
    this.activeName = name;
    if (name !== null) {
      const camera = this.get(name, params);
      this.onResize();
      return camera;
    } 
    return null;
  }

  private get aspect() { return this._aspect; }

  private set aspect(v) {
    this._aspect = v;
    if (this.camera !== null) {
      this.camera.aspect = v;
      this.camera.updateProjectionMatrix();
    }
  }

  private _update(name: string | symbol, params: ICameraParams) {
    const oldState = this.cameraStateMap.get(name) as IState;
    const camera = this.cameraMap.get(name) as PerspectiveCamera;
    const state = Object.assign(oldState, params) as IState;
    this.cameraStateMap.set(name, state);
    const { x, y, z } = state;
    camera.position.set(x, y, z);
  }

  public _follow(name: string | symbol, renderable: Renderable, offset: IPosition, lookAt?: (state: IRenderableState) => IPosition | any) {
    const camera = this.cameraMap.get(name);
    if (camera === undefined) return;
    const self = this;
    // 目前比较 trick 的做法：用一个不可视替身，作为被追踪者的孩子，从而维护相对坐标
    const obj = new Object3D();
    obj.name = `followed_by_${camera.uuid}`;
    obj.visible = false;
    renderable.add(obj);
    camera.userData['substitute'] = obj;
    renderable.watch(camera.uuid as string, (state: IRenderableState, oldState: IRenderableState) => {
      const { x: newX, y: newY, z: newZ } = state;
      const { x: sx, y: sy, z: sz  } = renderable.object.scale;
      // 距离是世界坐标系下的，所以先还原缩放
      obj.position.set(1 / sx * offset.x, 1 / sy * offset.y, 1 / sz * offset.z);
      const { x, y, z } = obj.getWorldPosition(new Vector3());
      self._update(name, { x, y, z });
      if (lookAt === undefined) {
        camera.lookAt(newX, newY, newZ)
      } else {
        const { x, y, z } = lookAt(state);
        if (x !== undefined && y !== undefined && z !== undefined) {
          camera.lookAt(x, y, z);
        }
      }
    })
  }

  private onResize() {
    const container = this.options.container as HTMLHRElement;
    const { width, height } = container.getBoundingClientRect();
    this.aspect = width / height;
  }
}