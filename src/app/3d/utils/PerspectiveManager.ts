import { Camera, PerspectiveCamera } from "three";

export interface IPerspectiveManagerOption {
  container?: HTMLElement,
  fov?: number,
  aspect?: number,
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

// todo 更多机位
export enum PerspectiveType {
  BACK,
  FIXED
}

export class PerspectiveManager {
  private options: IPerspectiveManagerOption;
  private activeType: PerspectiveType | null = null;
  private cameraMap: Map<PerspectiveType, Camera>;
  private cameraStateMap: Map<PerspectiveType, IState>;

  constructor(options: IPerspectiveManagerOption) {
    this.options = Object.assign(defaultOption, options);
    const { container } = this.options;
    if (this.options.aspect === undefined) {
      const { width, height } = (container as HTMLElement).getBoundingClientRect();
      options.aspect = width / height;
    }
    this.cameraMap = new Map();
    this.cameraStateMap = new Map();
  }

  public get camera() {
    if (this.activeType === null) {
      return null;
    }
    return this.cameraMap.get(this.activeType) as Camera;
  }

  /**
   * 更新当前相机
   * @param params 
   * @returns 
   */
  public update(params: ICameraParams) {
    if (this.activeType === null) {
      console.warn('No active camera to update!');
      return;
    }
    const oldState = this.cameraStateMap.get(this.activeType) as IState;
    const state = Object.assign(oldState, params) as IState;
    const { x, y, z, targetX, targetY, targetZ } = state;
    const camera = this.camera as Camera;
    camera.position.set(x, y, z);
    camera.lookAt(targetX, targetY, targetZ);
  }

  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    x && (this.camera?.translateX(x));
    y && (this.camera?.translateY(y));
    z && (this.camera?.translateZ(z));
  }

  /**
   * 
   * @param type 切换相机
   * @param params 
   */
  public get(type: PerspectiveType, params?: ICameraParams) {
    let camera = this.cameraMap.get(type);
    let state: ICameraParams;
    if (camera === undefined) {
      const { fov, aspect, near, far } = this.options;
      // 创建相机和状态
      camera = new PerspectiveCamera(fov, aspect, near, far);     
      this.cameraMap.set(type, camera);
      state = Object.assign(defaultParams, params); 
      this.cameraStateMap.set(type, state as IState);
    } else {
      state = params || {};
    }
    this.update(state);
    return camera;
  }

  /**
   * 
   * @param type 切换相机
   * @param params 
   */
  public switch(type: PerspectiveType, params?: ICameraParams) {
    this.activeType = type;
    return this.get(type, params);
  }
}