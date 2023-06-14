import { AnimationClip, AnimationMixer } from "three";
import { IRenderableParams, Renderable } from "./Renderable";

export interface IAnimatable {
  animate: (dt: number) => any,
  action: string,
  actionDuration: number,
}

export interface IAnimatableState {
  action: string,
}

export interface IAnimatableParams extends IRenderableParams {
  actionMap?: Map<string, AnimationClip>,
}

export abstract class Animatable extends Renderable implements IAnimatable {
  public mixer: AnimationMixer | null = null;
  protected actionMap: Map<string, AnimationClip>;
  private _idle: AnimationClip | null = null;
  protected _action: string = '';
  protected _actionTime: number = 0;

  constructor(params: IAnimatableParams) {
    super(params);
    this.actionMap = params.actionMap || new Map();
  }

  protected get idle(): AnimationClip | null { return this._idle; }

  protected set idle(v: AnimationClip | null) { this._idle = v; }

  public get action() { return this._action }

  public set action(name: string){
		if (this._action == name || this.mixer === null) return;
    let anim = this.actionMap.get(name);
    
    if (anim === undefined && this.idle !== null) {
      anim = this.idle;
    };
    if (anim !== undefined) {
      this._action = name;
		  this._actionTime = Date.now();
      this.mixer.stopAllAction();
      const clip = anim; 
      const action = this.mixer.clipAction(clip);

      // todo 抬手异常
      // action.fadeIn(0.5);
      action.play();
    }
	}

  public animate(dt: number) { this.mixer && this.mixer.update(dt); }

  public get actionDuration() { return Date.now() - this._actionTime; }
}