import { Camera, PerspectiveCamera } from "three";

export interface IPerspectiveManagerOption {
  fov?: number,
  aspect: number,
  near?: number,
  far?: number,
}

interface IParams {
  x?: number, 
  y?: number,
  z?: number,
  targetX?: number,
  targetY?: number,
  targetZ?: number,
}

interface IState extends IParams {
  x: number, 
  y: number,
  z: number,
  targetX: number,
  targetY: number,
  targetZ: number,
}

const defaultOption: IPerspectiveManagerOption = {
  fov: 75,
  aspect: 1,
  near: 0.1,
  far: 1000
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
  BACK
}

export class PerspectiveManager {
  private options: IPerspectiveManagerOption;
  private activeCamera: Camera | null;
  private cameraMap: Map<PerspectiveType, Camera>;
  private cameraState: Map<PerspectiveType, IState>;

  constructor(options: IPerspectiveManagerOption) {
    this.options = Object.assign(defaultOption, options);
    this.activeCamera = null;
    this.cameraMap = new Map();
    this.cameraState = new Map();
  }

  public get camera() {
    return this.activeCamera;
  }

  public switch(type: PerspectiveType, params?: IParams) {
    let camera = this.cameraMap.get(type);
    const oldState = this.cameraState.get(type);
    let state: IState;
    if (camera === undefined) {
      const { fov, aspect, near, far } = this.options;
      // 创建相机和状态
      camera = new PerspectiveCamera(fov, aspect, near, far);     
      state = Object.assign(defaultParams, params); 
      this.cameraMap.set(type, camera);
    } else if (params === undefined) {
      // 维持旧状态
      state = oldState as IState;
    } else {
      // 以传入参数为主
      state = Object.assign(oldState as IState, params);
    }
    const { x, y, z, targetX, targetY, targetZ } = state;
    camera.position.set(x, y, z);
    camera.lookAt(targetX, targetY, targetZ);
    this.activeCamera = camera;
  }
}