import { JoyStick } from "../lib/JoyStick";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Camera, Vector3 } from "three";
export interface IMoveState {
  forward: number,
  right: number,
  up: number,
}

export interface IControlManagerOption {
  container?: HTMLElement,
  showJoyStick?: Boolean,
  controlPointer?: Boolean,
  camera?: Camera
}

export const EventType = {
  move: 'move',
  mousedown: 'mousedown',
  mouseup: 'mouseup',
}

interface IMoveInnerState extends IMoveState {
  back: number,
  left: number,
}

const defaultControlManagerOptions = () => ({
  container: document.body,
  showJoyStick: true,
  controlPointer: true,
})

export interface IDestroyer {
  destory: (...args: any) => any
}
export interface IEventDispatcher {
  addEventListener: (...args: any) => any,
  removeEventListener: (...args: any) => any
}
export function delegate(el: IEventDispatcher, eventName: string, listener: (e: Event) => any): IDestroyer {
  el.addEventListener(eventName, listener);
  const destory = () => el.removeEventListener(eventName, listener);
  (el as any).destory = destory;
  return { destory }
}

export class ControlManager {
  private options: IControlManagerOption;
  private camera: Camera | null = null;
  private mounted: Boolean = false;
  private onMove: ((state: IMoveState) => any) | undefined;
  private onSwitchPerpective: (() => any) | undefined;
  private moveState: IMoveInnerState = { forward: 0, right: 0, back: 0, left: 0, up: 0 };
  public joyStick: JoyStick | null = null;
  private pointerLockControls: PointerLockControls | null = null;
  private destoryers: IDestroyer[] = [];
  private customDestoryers: IDestroyer[] = [];
  private _lastDirection: Vector3 | null = null;

  constructor(options: IControlManagerOption) {
    this.options = Object.assign(defaultControlManagerOptions(), options);
  }

  public get locked() { return this.pointerLockControls?.isLocked || false; }

  public update(options: IControlManagerOption) {
    this.options = Object.assign(this.options, options);
    if (options.camera !== undefined) {
      this.camera = options.camera;
    }
    if (this.mounted) {
      this._unmount().mount(this.camera, this.onMove, this.onSwitchPerpective);
    }
    return this;
  }

  public mount(camera: Camera | null, onMove?: ((params: IMoveState) => any), onSwitchPerpective?: () => any) {
    if (camera === null) {
      console.warn('No camera to be controled!');
      return this;
    }
    if (this.mounted) {
      console.warn('Controller is mounted!');
      return this;
    }
    this.mounted = true;
    this.camera = camera;
    this.onMove = onMove;
    this.onSwitchPerpective = onSwitchPerpective;

    const { container, showJoyStick, controlPointer } = this.options;
    
    // 手柄
    if (showJoyStick) {
      this.joyStick = new JoyStick({ 
        container, 
        onMove: (forward: number, turn: number) => onMove && onMove({ forward, right: turn, up: 0 })
      });
      this.joyStick.mount();
    }
    
    // 视角锁定控制
    if (controlPointer) {
      if (this.pointerLockControls !== null) {
        (this.pointerLockControls as any).destory();
      }
      this.pointerLockControls = new PointerLockControls(this.camera, container);
    }
    this.bindEvents();
    return this;
  }

  public unmount() {
    this._unmount();
    this.customDestoryers.forEach(destoryer => destoryer.destory());
    this.customDestoryers.length = 0;
    return this;
  }

  public on(name: string, listener: (e: Event) => any) {
    const destoryer = this._on(name, listener);
    this.customDestoryers.push(destoryer);
    return destoryer;
  }

  public get direction() {
    return this.pointerLockControls?.getDirection(new Vector3()).normalize() 
        || this.camera?.getWorldDirection(new Vector3())
        || new Vector3();; 
  }


  private bindEvents() {
    this.destoryers.push(this._on('keydown', this.onKeyDown.bind(this)));
    this.destoryers.push(this._on('keyup', this.onKeyUp.bind(this)));
    this.destoryers.push(this._on('mousedown', this.onMouseDown.bind(this)));
    this.destoryers.push(this._on('lock', this.onLock.bind(this)));
    this.destoryers.push(this._on('unlock', this.onUnLock.bind(this)));
  }

  private onKeyDown(e: Event) {
    const { moveState } = this;
    switch((e as KeyboardEvent).key) {
      case 'w':
      case 'ArrowUp':
         moveState.forward = 1; break;
      case 's': 
      case 'ArrowDown': 
        moveState.back = 1; break;
      case 'a':
      case 'ArrowLeft':
        moveState.left = 1; break;
      case 'd': 
      case 'ArrowRight': 
        moveState.right = 1; break;
      case ' ': 
        moveState.up = 1; break;
    }
    this._onMove();
  }

  private onKeyUp(e: Event) {
    const { moveState } = this;
    switch((e as KeyboardEvent).key) {
      case 'w': 
      case 'ArrowUp':
        moveState.forward = 0; break;
      case 's': 
      case 'ArrowDown': 
        moveState.back = 0; break;
      case 'a':
      case 'ArrowLeft':
        moveState.left = 0; break;
      case 'd': 
      case 'ArrowRight': 
        moveState.right = 0; break;
      case ' ': 
        moveState.up = 0; break;
      case 'q':
        this._onSwitchPerpective(); break;
    }
    this._onMove();
  }

  private _on(name: string, listener: (e: Event) => any) {
    let el: IEventDispatcher | undefined;
    if (/key/.test(name)) {
      el = window;
    } else if (/lock/.test(name) && this.options.controlPointer) {
      el = this.pointerLockControls as IEventDispatcher;
    } else {
      el = this.options.container as IEventDispatcher;
    }
    return delegate(el, name, listener);
  }

  /**
   * 不会销毁用户挂载的事件
   * @returns 
   */
  private _unmount() {
    if (!this.mounted) {
      console.warn('Controller is not mounted!');
      return this;
    }
    this.mounted = false;
    if (this.joyStick !== null) {
      this.joyStick.unmount();
      this.joyStick = null;
    }
    this.pointerLockControls = null;
    this.destoryers.forEach(destoryer => destoryer.destory());
    this.destoryers.length = 0;
    return this;
  }

  private _onMove() {
    const { onMove, moveState: { forward, back, right, left, up } } = this;
    onMove && onMove({ forward: forward - back, right: right - left, up });
  }

  private _onSwitchPerpective() {
    const { onSwitchPerpective } = this;
    onSwitchPerpective && onSwitchPerpective();
  }

  private onMouseDown(e: Event) {
    this.pointerLockControls?.lock();
  }

  private onLock(e: Event) { }

  private onUnLock(e: Event) {
    if (this.joyStick !== null) {
      this.joyStick.mount();
    }
  }

}