import { Camera, Scene } from "three";
import { ControlManager, IDestroyer, IMoveState } from "../managers/ControlManager";
import { ObjectManager } from "../managers/ObjectManager";
import { PerspectiveManager } from "../managers/PerspectiveManager";
import { SceneManager } from "../managers/SceneManager";

export interface IViewOption {
  sceneManager: SceneManager,
  objectManager: ObjectManager,
  perspectiveManager: PerspectiveManager,
  controlManager: ControlManager
}

export abstract class View {
  protected sceneManager: SceneManager;
  protected objectManager: ObjectManager;
  protected perspectiveManager: PerspectiveManager;
  protected controlManager: ControlManager;
  protected moveState: IMoveState = { forward: 0, right: 0, up: 0 };
  protected scene: Scene | null = null;
  protected camera: Camera | null = null;
  private eventMap = new Map<string, Set<(...args: any) => any>>();

  constructor(options: IViewOption) {
    const { sceneManager, objectManager, perspectiveManager, controlManager } = options
    this.sceneManager = sceneManager;
    this.objectManager = objectManager;
    this.perspectiveManager = perspectiveManager;
    this.controlManager = controlManager;
  }

  /**
   * 挂载，只在渲染前调用一次
   */
  public abstract mount(): any;

  /**
   * 卸载，在切换到别的页面时调用一次
   */
  public abstract unmount(): any;

  public abstract render(dt: number): any

  /**
   * 绑定事件
   * @param eventName 
   * @param listener 
   * @returns 
   */
  public on(eventName: string, listener: (...arg: any) => any): IDestroyer  {
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
  public off(eventName: string, listener: (...arg: any) => any) {
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
  protected emit(eventName: string, ...args: any) {
    let subs = this.eventMap.get(eventName);
    if (subs !== undefined) {
      subs.forEach(sub => sub(args));
    }
  }

  /**
   * 视角移动时发生
   * @param state
   */
  protected onMove(state: IMoveState) {
    this.moveState = state;
  }
}