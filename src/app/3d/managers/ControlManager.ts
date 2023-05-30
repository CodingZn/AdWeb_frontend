import { JoyStick } from "../lib/JoyStick";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Camera } from "three";
export interface IMoveState {
  forward: number,
  right: number,
  up: number,
}

export interface IControlManagerOption {
  container?: HTMLElement,
  showJoyStick?: Boolean,
  controlPointer?: Boolean,
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

const defaultControlManagerOptions = {
  container: document.body,
  showJoyStick: true,
  controlPointer: true,
}

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
  private moveState: IMoveInnerState = { forward: 0, right: 0, back: 0, left: 0, up: 0 };
  public joyStick: JoyStick | null = null;
  private pointerLockControls: PointerLockControls | null = null;
  private destoryers: IDestroyer[] = [];

  constructor(options: IControlManagerOption) {
    this.options = Object.assign(defaultControlManagerOptions, options);
  }

  public update(options: IControlManagerOption) {
    this.options = Object.assign(this.options, options);
    if (this.mounted) {
      this.unmount().mount(this.camera, this.onMove);
    }
    return this;
  }

  public mount(camera: Camera | null, onMove?: ((params: IMoveState) => any)) {
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

    const { container, showJoyStick, controlPointer } = this.options;
    if (showJoyStick) {
      this.joyStick = new JoyStick({ 
        container, 
        onMove: (forward: number, turn: number) => onMove && onMove({ forward, right: turn, up: 0 })
      });
      this.joyStick.mount();
    }
    if (this.pointerLockControls !== null) {
      (this.pointerLockControls as any).destory();
    }
    if (controlPointer) {
      this.pointerLockControls = new PointerLockControls(this.camera, container);
    }
    this.bindEvents();
    return this;
  }

  public unmount() {
    if (!this.mounted) {
      console.warn('Controller is not mounted!');
      return this;
    }
    this.mounted = false;
    if (this.joyStick !== null) {
      this.joyStick.unmount();
    }
    this.destoryers.forEach(destoryer => destoryer.destory());
    this.destoryers.length = 0;
    return this;
  }

  public on(name: string, listener: (e: Event) => any) {
    let el: IEventDispatcher | undefined;
    if (/key/.test(name)) {
      el = window;
    } else if (/lock/.test(name) && this.options.controlPointer) {
      el = this.pointerLockControls as IEventDispatcher;
    } else {
      el = this.options.container as IEventDispatcher;
    }
    const destoryer = delegate(el, name, listener);
    this.destoryers.push(destoryer);
    return destoryer;
  }

  private bindEvents() {
    this.on('keydown', this.onKeyDown.bind(this));
    this.on('keyup', this.onKeyUp.bind(this));
    this.on('mousedown', this.onMouseDown.bind(this));
    this.on('lock', this.onLock.bind(this));
    this.on('unlock', this.onUnLock.bind(this));
  }

  private onKeyDown(e: Event) {
    const { moveState } = this;
    switch((e as KeyboardEvent).key) {
      case 'w': moveState.forward = 1; break;
      case 's': moveState.back = 1; break;
      case 'a': moveState.left = 1; break;
      case 'd': moveState.right = 1; break;
      case ' ': moveState.up = 1; break;
    }
    this._onMove();
  }

  private onKeyUp(e: Event) {
    const { moveState } = this;
    switch((e as KeyboardEvent).key) {
      case 'w': moveState.forward = 0; break;
      case 's': moveState.back = 0; break;
      case 'a': moveState.left = 0; break;
      case 'd': moveState.right = 0; break;
      case ' ': moveState.up = 0; break;
    }
    this._onMove();
  }

  private _onMove() {
    const { onMove, moveState: { forward, back, right, left, up } } = this;
    onMove && onMove({ forward: forward - back, right: right - left, up });
  }

  private onMouseDown(e: Event) {
    this.pointerLockControls?.lock();
    if (this.joyStick !== null) {
      this.joyStick.unmount();
    }
  }

  private onLock(e: Event) {}

  private onUnLock(e: Event) {
    if (this.joyStick !== null) {
      this.joyStick.mount();
    }
  }
}