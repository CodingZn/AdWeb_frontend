import { Camera, Scene, Vector3 } from "three";
import { LocalPlayer } from "../LocalPlayer";
import { AssetManager } from "../managers/AssetManager";
import { ControlManager, IDestroyer, IMoveState } from "../managers/ControlManager";
import { ObjectManager } from "../managers/ObjectManager";
import { ICameraParams, PerspectiveManager } from "../managers/PerspectiveManager";
import { SceneManager } from "../managers/SceneManager";

export interface IManagers {
  sceneManager: SceneManager,
  objectManager: ObjectManager,
  perspectiveManager: PerspectiveManager,
  controlManager: ControlManager,
  assetManager: AssetManager,
}

// todo 更多机位
export const PerspectiveType = {
  BACK: Symbol('back'),
  FIRST: Symbol('first'),
  FRONT: Symbol('front'),
  FIXED: Symbol('fixed'),
}

export interface IViewOption extends IManagers {
  name: string,
  localPlayer?: LocalPlayer,
  perspectives?: (string | symbol | { type: string | symbol, params: ICameraParams })[];
}

export interface IViewProps {
  [key: string]: any
}

const defaultViewOption = () => ({
  perspectives: [PerspectiveType.FIRST, PerspectiveType.BACK]
})

export abstract class View {
  protected _name: string; 
  protected sceneManager: SceneManager;
  protected objectManager: ObjectManager;
  protected perspectiveManager: PerspectiveManager;
  protected controlManager: ControlManager;
  protected assetManager: AssetManager;
  protected moveState: IMoveState = { forward: 0, right: 0, up: 0 };
  protected scene: Scene | null = null;
  protected camera: Camera | null = null;
  protected localPlayer: LocalPlayer | null;
  protected perspectives: (string | symbol | { type: string | symbol, params: ICameraParams })[] = [];
  private eventMap = new Map<string | symbol | number, Set<(...args: any) => any>>();

  constructor(options: IViewOption) {
    const { 
      name,
      sceneManager,
      objectManager, 
      assetManager, 
      perspectiveManager, 
      controlManager,
      localPlayer,
      perspectives
    } = Object.assign(defaultViewOption(), options);
    this.sceneManager = sceneManager;
    this.objectManager = objectManager;
    this.assetManager = assetManager;
    this.perspectiveManager = perspectiveManager;
    this.controlManager = controlManager;
    this.localPlayer = localPlayer || null;
    this.perspectives = perspectives;
    this._name = name;
    // 初始化机位
    
    this.perspectiveManager.get(PerspectiveType.FIRST, { 
      x: 0, y: 20, z: 0, 
      parent: localPlayer?.object,
      lookAt: (state) => ({ x: state.x, y: 25, z: state.z + 100 }) })
    this.perspectiveManager.get(PerspectiveType.BACK, {
      x: 0, y: 50, z: -50, 
      parent: localPlayer?.object, 
      lookAt: (state) => ({ x: state.x, y: 25, z: state.z }) })
    this.perspectiveManager.get(PerspectiveType.FRONT, { 
      x: 0, y: 50, z: 50, 
      parent: localPlayer?.object,
      lookAt: (state) => ({ x: state.x, y: 25, z: state.z }) })
  }

  public get name() { return this._name; }

  protected set name(v) { this._name = v; }

  /**
   * 挂载，只在渲染前调用一次
   */
  public mount(props?: IViewProps) {
    this.onSwitchPerspective();
    if (this.localPlayer === null) {
      this.controlManager.update({ showJoyStick: false, controlPointer: false })
    } else {
      this.controlManager.update({ showJoyStick: true, controlPointer: true })
    }
    this.controlManager.mount(
      this.camera, 
      this.onMove.bind(this), 
      this.onSwitchPerspective.bind(this)
    )
    this.scene = this.sceneManager.switch(this.name);
    this.scene.add(this.camera as Camera);
    this.mounted(props);
    return this;
  }

  /**
   * 挂载后钩子，只在挂载后渲染前调用一次
   */
  protected abstract mounted(props?: IViewProps): any;

  /**
   * 销毁前钩子，只在卸载前调用一次
   */
  protected abstract beforeDestoryed(): any;

  /**
   * 卸载，在切换到别的页面时调用一次
   */
  public unmount() {
    this.beforeDestoryed();
    this.controlManager.unmount();
    if (this.localPlayer !== null) {
      this.perspectiveManager.unfollow(this.localPlayer.object);
    }
    this.perspectiveManager.switch(null);
  }

  public abstract render(dt: number): any;

  /**
   * 绑定事件
   * @param eventName 
   * @param listener 
   * @returns 
   */
  public on(eventName: string | symbol | number, listener: (...arg: any) => any): IDestroyer  {
    let subs = this.eventMap.get(eventName);
    if (subs === undefined) {
      subs = new Set();
    }
    subs.add(listener);
    this.eventMap.set(eventName, subs);
    const self = this;
    return {
      destory: () => self.off(eventName, listener)
    }
  }

  /**
   * 取消绑定事件
   * @param eventName 
   * @param listener 
   */
  public off(eventName: string | symbol | number, listener: (...arg: any) => any) {
    let subs = this.eventMap.get(eventName);
    if (subs !== undefined) {
      subs.delete(v => v === listener);
    }
  }

  /**
   * 触发绑定的事件
   * @param eventName 
   * @param args 
   */
  protected emit(eventName: string | symbol | number, ...args: any) {
    let subs = this.eventMap.get(eventName);
    if (subs !== undefined) {
      subs.forEach(sub => sub(...args));
    }
  }

  /**
   * 视角移动时发生
   * @param state
   */
  protected onMove(state: IMoveState) {
    this.moveState = state;
  }

  /**
   * 切换视角时发生
   */
  protected onSwitchPerspective() {
    const { perspectiveManager, perspectives } = this;
    if (perspectives.length === 0) return;
    const { active } = perspectiveManager;
    let index = -1;
    if (active !== null) {
      index = perspectives.indexOf(active);
    }
    index = (index + 1) % perspectives.length;
    const perpective = perspectives[index];
    if (typeof perpective === 'object') {
      this.camera = perspectiveManager.switch(perpective.type, perpective.params);
    } else {
      this.camera = perspectiveManager.switch(perpective as string | symbol);
    }
  }

  /**
   * 每次渲染时计算移动
   * @param dt 
   * @returns 
   */
  protected move(dt: number) {
    if (this.localPlayer === null) return;
    const { active } = this.perspectiveManager
    if (active === PerspectiveType.FIRST) {
      // 第一人称隐去角色
      this.localPlayer.object.update({ visible: false })
    } else {
      this.localPlayer.object.update({ visible: true })
    }

    const { forward, right, up } = this.moveState;
    const speed = 10;
    const object = this.localPlayer.object.object;
    const matrix = object.matrixWorld.clone().invert();
    if (forward !== 0) {
      let z = forward * speed * dt;
      // const dir = new Vector3(0, 0, z).applyMatrix4(matrix);
      // if (this.sceneManager.collide(object, dir) !== null) {
      //   z = 0;
      // }
      this.localPlayer.move({ z });
    }
    if (right !== 0) {
      let x = - right * speed * dt;
      // const dir = new Vector3(x, 0, 0).applyMatrix4(matrix);
      // if (this.sceneManager.collide(object, dir) !== null) {
      //   x = 0;
      // }
      this.localPlayer.move({ x });
    }
  }
}