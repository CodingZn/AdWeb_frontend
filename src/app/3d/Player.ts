import { assign } from "lodash";
import { AnimationClip, AnimationMixer, AnimationUtils } from "three";
import { AssetManager } from "./managers/AssetManager";
import { Renderable, defaultRenderableParams, ITransformType } from "./utils/Renderable";
import { ActionMap, Actions } from "./views/View";

export interface IPlayerParams {
  name?: string,
  profileID?: number,
  x?: number,
  y?: number,
  z?: number,
  h?: number  // 朝向，弧度制
  pb?: number  // 朝向，弧度制
  action?: string,
}

export interface IPlayerState extends IPlayerParams {
  name: string,
  profileID: number,
  x: number,
  y: number,
  z: number,
  h: number,
  pb: number,
  action: string,
}

const defaultPlayerParams: () => IPlayerState = () => ({
  profileID: 0,
  h: 0,
  pb: 0,
  action: Actions.IDLE,
  ...defaultRenderableParams()
})

export const ProfileMap = [
  'BeachBabe', 
  'BusinessMan', 
  'Doctor', 
  'FireFighter', 
  'Policeman', 
  'Prostitute',
  'Punk', 
  'RiotCop', 
  'Robber', 
  'Sheriff', 
  'Waitress'
];

export class Player {
  private obj: Renderable;
  public mixer: AnimationMixer | null = null;
  private idleAnim: AnimationClip | null = null;
  private assetManager: AssetManager;
  private _action: string = '';
  private _actionTime: number = 0;
  private _profileID: number = -1;

  constructor(params: IPlayerParams, assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.obj = this._update(defaultPlayerParams(), params).obj;
  }

  public get state(): IPlayerState {
    const { name, x, y, z, euler: { x: pb, y: h } } = this.object.state;
    const { profileID, action } = this;
    return { name, profileID, x, y, z, h, pb, action };
  }

  public get object() {
    return this.obj;
  }

  public get name() { return this.state.name; }
  
  public get profileID() { return this._profileID; }

  public get action(){ return this._action; }

  public update(params: IPlayerParams) {
    return this._update(this.state, params);
  }

  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    this.transform({ translateX: x || 0, translateY: y || 0, translateZ: z || 0 })
  }

  public transform(params: ITransformType) {
    this.object.transform(params);
    return this;
  }

  private set action(name: string){
		if (this._action == name || this.mixer === null) return;
    let anim = ActionMap.get(name);
    
    if (anim === undefined && this.idleAnim !== null) {
      anim = this.idleAnim;
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

  public act(dt: number) { this.mixer && this.mixer.update(dt); }

  public get actionDuration() { return Date.now() - this._actionTime; }

  private _update(oldParams: IPlayerState, params: IPlayerParams) {
    const { name, profileID, x, y, z, h, pb, action } = assign(oldParams, params);
    if (this._profileID !== profileID) {
      this._profileID = profileID;
      // 需要重新加载模型
      const profileName = ProfileMap[profileID as number];
      const obj = new Renderable({ name });
      if (this.obj) {
        obj.copy(this.obj);
        this.obj.destory();
      }
      this.obj = obj;

      const self = this;
      this.assetManager.get(`fbx/people/${profileName}.fbx`, { forceUpdate: true })
      .then((res) => {
        obj.onLoad([res]);
        self.idleAnim = res.animations[0];
        res.mixer = self.mixer = new AnimationMixer(res);
        self.action = action;
        return Promise.resolve(self.assetManager);
      })
      .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
      .then((res) => obj.onLoad([res]));
    } else {
      this.action = action;
    }
    this.obj.update({ name, x, y, z, euler: { x: pb, y: h, z: pb } });
    return this;
  }
}