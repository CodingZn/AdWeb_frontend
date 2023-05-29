import { ControlManager, IMoveState } from "../utils/ControlManager";
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
  constructor(options: IViewOption) {
    const { sceneManager, objectManager, perspectiveManager, controlManager } = options
    this.sceneManager = sceneManager;
    this.objectManager = objectManager;
    this.perspectiveManager = perspectiveManager;
    this.controlManager = controlManager;
  }

  public onMove(state: IMoveState) {
    this.moveState = state;
  }

  public render(dt: number) {}
}