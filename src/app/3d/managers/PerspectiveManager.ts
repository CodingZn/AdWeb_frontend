import { Camera, Object3D, PerspectiveCamera, Scene } from "three";
import { Renderable } from "../utils/Renderable";

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
  targetX?: number,
  targetY?: number,
  targetZ?: number,
}

interface IState extends ICameraParams {
  x: number, 
  y: number,
  z: number,
  targetX: number,
  targetY: number,
  targetZ: number,
}

const defaultOption: IPerspectiveManagerOption = {
  container: document.body,
  fov: 45,
  near: 0.1,
  far: 200000
}

const defaultParams: IState = {
  x: 0, 
  y: 0,
  z: 10,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
}

export class PerspectiveManager {
  private options: IPerspectiveManagerOption;
  private activeName: string | symbol | null = null;
  private cameraMap: Map<string | symbol, PerspectiveCamera>;
  private cameraStateMap: Map<string | symbol, IState>;
  private _aspect: number = 1;

  constructor(options: IPerspectiveManagerOption) {
    this.options = Object.assign(defaultOption, options);
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
   * 更新当前相机
   * @param params 
   * @returns 
   */
  public update(params: ICameraParams) {
    if (this.activeName === null) {
      console.warn('No active camera to update!');
      return;
    }
    const oldState = this.cameraStateMap.get(this.activeName) as IState;
    const state = Object.assign(oldState, params) as IState;
    const { x, y, z, targetX, targetY, targetZ } = state;
    const camera = this.camera as PerspectiveCamera;
    camera.position.set(x, y, z);
    camera.lookAt(targetX, targetY, targetZ);
  }

  public follow(renderable: Renderable | Object3D) {
    if (this.activeName === null) {
      console.warn('No active camera to follow!');
      return;
    }
    let object = renderable;
    if (renderable instanceof Renderable) {
      object = renderable.object;
    }
    object.add(this.camera as PerspectiveCamera);
  }

  /**
   * 移动当前相机
   * @param params 
   */
  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    const { camera } = this;
    if (camera) {
      let object;
      const { parent } = camera;
      if (parent === null || parent instanceof Scene) {
        object = camera;
      } else {
        object = parent;
      }
      x && (object?.translateX(x));
      y && (object?.translateY(y));
      z && (object?.translateZ(z));
    }
  }

  /**
   * 
   * @param type 切换相机
   * @param params 
   */
  public get(name: string | symbol, params?: ICameraParams) {
    let camera = this.cameraMap.get(name);
    let state: ICameraParams;
    if (camera === undefined) {
      const { options: { fov, near, far }, aspect } = this;
      // 创建相机和状态
      camera = new PerspectiveCamera(fov, aspect, near, far);     
      this.cameraMap.set(name, camera);
      state = Object.assign(defaultParams, params); 
      this.cameraStateMap.set(name, state as IState);
    } else {
      state = params || {};
    }
    this.update(state);
    return camera;
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

  private onResize() {
    const container = this.options.container as HTMLHRElement;
    const { width, height } = container.getBoundingClientRect();
    this.aspect = width / height;
  }
}