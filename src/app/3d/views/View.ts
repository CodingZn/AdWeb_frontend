import { assign, keys } from "lodash";
import { AnimationClip, Camera, PerspectiveCamera, Scene, Vector3 } from "three";
import { LocalPlayer } from "../LocalPlayer";
import { AssetManager } from "../managers/AssetManager";
import { ControlManager, IDestroyer, IMoveState } from "../managers/ControlManager";
import { ObjectManager } from "../managers/ObjectManager";
import { ICameraParams, PerspectiveManager } from "../managers/PerspectiveManager";
import { SceneManager } from "../managers/SceneManager";
import { IRenderable } from "../utils/Renderable";

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

export interface IActions {
  IDLE: string,
  WALKING: string,
  WALKING_BACKWARDS: string,
  TURN: string,
  RUNNING: string,
  POINTING: string,
  TALKING: string,
  POINTING_GESTURE: string,
  DRIVING: string,
}

export const Actions: IActions = {
  IDLE: 'Idle',
  WALKING: 'Walking', 
  WALKING_BACKWARDS: 'Walking Backwards', 
  TURN: 'Turn', 
  RUNNING: 'Running', 
  POINTING: 'Pointing', 
  TALKING: 'Talking', 
  POINTING_GESTURE: 'Pointing Gesture',
  DRIVING: 'Driving'
};

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

const sgn = (v: number) => v === 0 ? 0 
                                   : v > 0 
                                     ? 1 
                                     : -1;

export const ActionMap = new Map<string, AnimationClip>();

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
    } = assign(defaultViewOption(), options);
    this.sceneManager = sceneManager;
    this.objectManager = objectManager;
    this.assetManager = assetManager;
    this.perspectiveManager = perspectiveManager;
    this.controlManager = controlManager;
    this.localPlayer = localPlayer || null;
    this.perspectives = perspectives;
    this._name = name;
    // 初始化机位
    const lockedLookAtHandler = (state: IRenderable) => {
      if (controlManager.locked) {
        return {}
      }
      return null;
    }
    this.perspectiveManager.get(PerspectiveType.FIRST, {
      x: 0, y: 25, z: 0, 
      parent: localPlayer?.object,
      lookAt: (state) => (lockedLookAtHandler(state) || { x: state.x, y: 25, z: state.z + 100 }) })
    this.perspectiveManager.get(PerspectiveType.BACK, {
      x: 0, y: 35, z: -35, 
      parent: localPlayer?.object, 
      lookAt: (state) => (lockedLookAtHandler(state) || { x: state.x, y: 25, z: state.z }) })
    this.perspectiveManager.get(PerspectiveType.FRONT, { 
      x: 0, y: 35, z: 35, 
      parent: localPlayer?.object,
      lookAt: (state) => (lockedLookAtHandler(state) || { x: state.x, y: 25, z: state.z }) })
    // 初始化动画
    const self = this;
    keys(Actions).forEach(key => {
      const anim = Actions[key as keyof IActions];
      anim !== Actions.IDLE && assetManager.get(`fbx/anims/${anim}.fbx`).then(res => {
        ActionMap.set(anim, res.animations[0])
      }) 
    })    
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
    this.controlManager.update({ camera: this.camera as PerspectiveCamera  });
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

    // lock 状态下，玩家角度由相机更新
    if (this.controlManager.locked) {
      const { direction } = this.controlManager;
      const { direction: playerDir } = this.localPlayer.object;
      // 只有 xz 平面上的转动
      direction.setY(0).normalize();
      playerDir.setY(0).normalize();
      // 计算 xy 平面上的旋转弧度
			if (this.perspectiveManager.active === PerspectiveType.FRONT) playerDir.negate();
			const rad = Math.acos(playerDir.dot(direction)) * sgn(playerDir.cross(direction).y);
      if (Math.abs(rad) > 0.01) {
				this.localPlayer.transform({ rotateY: rad })
			}
    }

    const { forward, right, up } = this.moveState;

    let speed = 20;
    // 动作
    if (forward !== 0 || right !== 0) {
      if (this.localPlayer.action === Actions.RUNNING) {
        speed = 50;
      } else if (this.localPlayer.action === Actions.WALKING && this.localPlayer.actionDuration > 2000) {
        this.localPlayer.action = Actions.RUNNING;
        speed = 50;
      } else {
        this.localPlayer.action = Actions.WALKING;
      }
    } else {
      this.localPlayer.action = Actions.IDLE;
    }
    this.localPlayer.act(dt);
    const object = this.localPlayer.object.object;
    const quaternion = object.quaternion.clone();
    if (forward !== 0) {
      let z = forward * speed * dt;
      const dir = new Vector3(0, 0, z).applyQuaternion(quaternion);
      const intersect = this.sceneManager.collide(object, dir, 25)
      if (intersect !== null) {
        z = -sgn(z) *  (30 - intersect.distance);
      }
      this.localPlayer.move({ z });
    }
    if (right !== 0) {
      let x = - right * speed * dt;
      const dir = new Vector3(x, 0, 0).applyQuaternion(quaternion);
      const intersect = this.sceneManager.collide(object, dir, 25)
      if (intersect !== null) {
        x = -sgn(x) *  (30 - intersect.distance);
      }
      this.localPlayer.move({ x });
    }
    
  }
}