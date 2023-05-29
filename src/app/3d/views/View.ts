import { Camera, Scene } from "three";
import { ControlManager, IDestroyer, IMoveState } from "../utils/ControlManager";
import { ObjectManager } from "../utils/ObjectManager";
import { PerspectiveManager } from "../utils/PerspectiveManager";
import { SceneManager } from "../utils/SceneManager";

export interface IViewOption {
  sceneManager: SceneManager,
  objectManager: ObjectManager,
  perspectiveManager: PerspectiveManager,
  controlManager: ControlManager
}

export class View {
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

  protected onMove(state: IMoveState) {
    this.moveState = state;
  }

  public mount() {}
  public unmount() {}

  public render(dt: number) {}

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

  public off(eventName: string, listener: (...arg: any) => any) {
    let subs = this.eventMap.get(eventName);
    if (subs !== undefined) {
      subs.delete(v => v === listener);
    }
  }

  protected emit(eventName: string, ...args: any) {
    let subs = this.eventMap.get(eventName);
    if (subs !== undefined) {
      subs.forEach(sub => sub(args));
    }
  }
}