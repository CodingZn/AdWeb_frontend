import { assign, keys } from "lodash";
import { AnimationClip, Camera, PerspectiveCamera, Scene, Vector3 } from "three";
import { LocalPlayer } from "../characters/LocalPlayer";
import { AssetManager } from "../managers/AssetManager";
import { ControlManager, IDestroyer } from "../managers/ControlManager";
import { ICameraParams, PerspectiveManager } from "../managers/PerspectiveManager";
import { SceneManager } from "../managers/SceneManager";
import { IMoveable, IMoveState, Moveable } from "../utils/Moveable";
import { IRenderableState, Renderable } from "../utils/Renderable";
import { Animatable, IAnimatable } from "../utils/Animatable";
import { CHARACTER_HEIGHT, EYE_HEIGHT } from "../characters/Character";
import { IPlayerState, Player } from "../characters/Player";
import { Disposable } from "../utils/Disposable";

export interface IManagers {
  sceneManager: SceneManager,
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
};

export interface IViewOption extends IManagers {
  name: string,
  localPlayer?: LocalPlayer,
  playerMap?: Map<string, Player>, 
  perspectives?: (string | symbol | { type: string | symbol, params: ICameraParams })[];
}

export interface IViewProps {
  [key: string]: any
}

const defaultViewOption = () => ({
  perspectives: [PerspectiveType.FIRST, PerspectiveType.BACK, PerspectiveType.FRONT]
})

export const ActionMap = new Map<string, AnimationClip>();

export abstract class View extends Disposable {
  protected _name: string; 
  protected sceneManager: SceneManager;
  protected perspectiveManager: PerspectiveManager;
  protected controlManager: ControlManager;
  protected assetManager: AssetManager;
  protected scene: Scene | null = null;
  protected camera: Camera | null = null;
  protected localPlayer: LocalPlayer | null;
  protected localPlayerState: IPlayerState | null = null;
  protected playerMap: Map<string, Player> = new Map();
  protected movables: Set<IMoveable> = new Set();
  protected animatables: Set<IAnimatable> = new Set();
  protected perspectives: (string | symbol | { type: string | symbol, params: ICameraParams })[] = [];
  private eventMap = new Map<string | symbol | number, Set<(...args: any) => any>>();
  private lastPerpectiveIndex: number | undefined;

  constructor(options: IViewOption) {
    super();
    const { 
      name,
      sceneManager,
      assetManager, 
      perspectiveManager, 
      controlManager,
      localPlayer,
      playerMap,
      perspectives
    } = assign(defaultViewOption(), options);
    this.sceneManager = sceneManager;
    this.assetManager = assetManager;
    this.perspectiveManager = perspectiveManager;
    this.controlManager = controlManager;
    this.localPlayer = localPlayer || null;
    this.playerMap = playerMap || new Map();
    this.perspectives = perspectives;
    this._name = name;
    // 初始化机位
    const lockedLookAtHandler = (state: IRenderableState) => {
      if (controlManager.locked) {
        return {}
      }
      return null;
    }
    this.perspectiveManager.get(PerspectiveType.FIRST, {
      x: 0, y: EYE_HEIGHT, z: 0, 
      parent: localPlayer,
      lookAt: (state) => (lockedLookAtHandler(state) || new Vector3(state.x, EYE_HEIGHT, state.z).addScaledVector(localPlayer!.direction as Vector3, 1000)) })
    this.perspectiveManager.get(PerspectiveType.BACK, {
      x: 0, y: CHARACTER_HEIGHT * 1.8, z: -550, 
      parent: localPlayer, 
      lookAt: (state) => (lockedLookAtHandler(state) || { x: state.x, y: CHARACTER_HEIGHT, z: state.z }) })
    this.perspectiveManager.get(PerspectiveType.FRONT, { 
      x: 0, y: CHARACTER_HEIGHT * 1.8, z: 550, 
      parent: localPlayer,
      lookAt: (state) => (lockedLookAtHandler(state) || { x: state.x, y: CHARACTER_HEIGHT, z: state.z }) })
    // 初始化动画
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
    this.onSwitchPerspective(this.lastPerpectiveIndex);
    if (this.localPlayer === null) {
      this.controlManager.update({ showJoyStick: false, controlPointer: false })
    } else {
      this.controlManager.update({ showJoyStick: true, controlPointer: true })
    }
    this.controlManager.mount(
      this.camera, 
      this.onMove.bind(this), 
      this.onSwitchPerspective.bind(this)
    );
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
   * 向场景中添加物体
   * @param renderable 
   * @param isCollider 
   */
  protected add(renderable: Renderable) {
    if ((renderable as Moveable).move) {
      this.movables.add(renderable as Moveable);
    } 
    if ((renderable as Animatable).animate) {
      this.animatables.add((renderable as Animatable));
    }
    this.sceneManager.add(renderable);
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
    this.localPlayer?.onMove(state);
  }

  /**
   * 切换视角时发生
   */
  protected onSwitchPerspective(index?: number) {
    const { perspectiveManager, perspectives } = this;
    if (perspectives.length === 0) return;
    const { active } = perspectiveManager;
    if (index ===  undefined) {
      index = -1;
      if (active !== null) {
        index = perspectives.indexOf(active);
      }
      index = (index + 1) % perspectives.length;
    }
    this.lastPerpectiveIndex = index;
    const perpective = perspectives[index];
    
    if (typeof perpective === 'object') {
      this.camera = perspectiveManager.switch(perpective.type, perpective.params);
    } else {
      this.camera = perspectiveManager.switch(perpective as string | symbol);
    }
    if (this.controlManager.locked) {
      this.controlManager.unlock().lock();
    }
    this.controlManager.update({ camera: this.camera as PerspectiveCamera  });
  }

  /**
   * 每次渲染时计算移动
   * @param dt 
   * @returns 
   */
  public render(dt: number) {
    if (this.localPlayer === null) return;
    const { active } = this.perspectiveManager
    if (active === PerspectiveType.FIRST) {
      // 第一人称隐去角色
      this.localPlayer.update({ visible: false })
    } else {
      this.localPlayer.update({ visible: true })
    }

    // lock 状态下，玩家角度由相机更新
    if (this.controlManager.locked) {
      const { direction } = this.controlManager;
      if (this.perspectiveManager.active === PerspectiveType.FRONT) direction.negate();
      this.localPlayer.direction = direction;
    }
    
    this.movables.forEach(v => v.move(dt, this.sceneManager.renderables));    
    this.animatables.forEach(v => v.animate(dt));

    this.sceneManager.render(this.camera);
  }
}