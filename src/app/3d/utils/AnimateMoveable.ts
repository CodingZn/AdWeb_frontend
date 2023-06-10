import { AnimationAction, AnimationClip, AnimationMixer } from "three";
import { IAnimatable, IAnimatableParams, IAnimatableState } from "./Animatable";
import { IMoveable, IMoveableParams, IMoveableState, Moveable } from "./Moveable";

export interface IAnimateMoveable extends IAnimatable, IMoveable {}

export interface IAnimateMoveableParams extends IAnimatableParams, IMoveableParams {}

export interface IAnimateMoveableState extends IAnimatableState, IMoveableState {}

export abstract class AnimateMoveable extends Moveable implements IAnimatable, IMoveable {  
  public mixer: AnimationMixer | null = null;
  protected actionMap: Map<string, AnimationClip>;
  protected _idle: AnimationClip | null = null;
  protected _action: string = '';
  protected _actionTime: number = 0;
  private currentAction: AnimationAction | null = null;
  private queueActionName: string | null = null;
  private actionTimer: any | null = null;

  constructor(params: IAnimateMoveableParams) { 
    super(params);
    this.actionMap = params.actionMap || new Map();
  }
  protected get idle(): AnimationClip | null { return this._idle; }

  protected set idle(v: AnimationClip | null) { this._idle = v; }

  public get action() { return this._action }

  public set action(name: string){
		if (this._action === name || this.mixer === null) return;
    
    if (this.actionTimer !== null) {
      this.queueActionName = name;
      return;
    }
    
    let anim = this.actionMap.get(name);
    
    if (anim === undefined && this.idle !== null) {
      anim = this.idle;
    };

    if (anim !== undefined) {
      this._action = name;
		  this._actionTime = Date.now();
      const clip = anim; 
      const action = this.mixer.clipAction(clip);

      if (this.currentAction === action) return;

      // swap action
      const self = this;
      const previousAction = this.currentAction;
      this.currentAction = action;

      // cross fade to the new action
      const crossFadeDurationInSecond = 0.3;

      previousAction?.crossFadeTo(
        action,
        crossFadeDurationInSecond,
        false
      );

      this.actionTimer = setTimeout(() => {
        previousAction?.stop();
        if (self.queueActionName !== null) {
          self.action = self.queueActionName;
        }
        self.actionTimer = null;
      }, crossFadeDurationInSecond * 1000);
      action.play();
    }
	}

  public animate(dt: number) { this.mixer && this.mixer.update(dt); }

  public get actionDuration() { return Date.now() - this._actionTime; }
}