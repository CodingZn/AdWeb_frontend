import { JoyStick } from "../lib/JoyStick";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Camera } from "three";

export interface IMoveState {
  forward: number,
  right: number,
  up: number,
}

interface IMoveInnerState extends IMoveState {
  back: number,
  left: number,
}

export interface IControlManagerOption {
  container?: HTMLElement,
  onMove?: (params: IMoveState) => any
}

const defaultControlManagerOptions = {
  container: document.body,
  onMove: (params: IMoveState) => {}
}

interface IDestroyer {
  destory: (...args: any) => any
}
interface IEventDispatcher {
  addEventListener: (...args: any) => any,
  removeEventListener: (...args: any) => any
}
function delegate(el: IEventDispatcher, eventName: string, listener: (e: Event) => any): IDestroyer {
  el.addEventListener(eventName, listener);
  const destory = () => el.removeEventListener(eventName, listener);
  (el as any).destory = destory;
  return { destory }
}

export class ControlManager {
  private container: HTMLElement;
  private camera: Camera | null = null;
  private onMove: (state: IMoveState) => any;
  private moveState: IMoveInnerState = { forward: 0, right: 0, back: 0, left: 0, up: 0 };
  private joyStick: JoyStick;
  private pointerLockControls: PointerLockControls | null = null;
  private destoryers: IDestroyer[] = [];

  constructor(options: IControlManagerOption) {
    const { container, onMove } = Object.assign(defaultControlManagerOptions, options);
    this.container = container;
    this.onMove = onMove;
    this.joyStick = new JoyStick({ 
      container, 
      onMove: (forward: number, turn: number) => onMove({ forward, right: turn, up: 0 })
    });
  }

  public on(camera: Camera | null) {
    if (camera === null) {
      console.warn('No camera to be controled!');
      return;
    }
    this.camera = camera;
    this.joyStick.mount();
    if (this.pointerLockControls !== null) {
      (this.pointerLockControls as any).destory();
    }
    this.pointerLockControls = new PointerLockControls(this.camera, this.container);
    this.bindEvents();
    this.pointerLockControls.lock();
  }

  public off() {
    this.joyStick.unmount();
    this.destoryers.forEach(destoryer => destoryer.destory());
  }

  private bindEvents() {
    const { container, pointerLockControls, destoryers } = this;
    destoryers.push(delegate(window, 'keydown', this.onKeyDown.bind(this)));
    destoryers.push(delegate(window, 'keyup', this.onKeyUp.bind(this)));
    destoryers.push(delegate(container, 'mousedown', this.onMouseDown.bind(this)));
    destoryers.push(delegate(pointerLockControls as IEventDispatcher, 'lock', this.onLock.bind(this)));
    destoryers.push(delegate(pointerLockControls as IEventDispatcher, 'unlock', this.onUnLock.bind(this)));
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
    onMove({ forward: forward - back, right: right - left, up });
  }

  private onMouseDown(e: Event) {
    this.pointerLockControls?.lock();
    this.joyStick.unmount();
  }

  private onLock(e: Event) {}

  private onUnLock(e: Event) {
    this.joyStick.mount();
  }
}