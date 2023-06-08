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
  h?: number  // 朝向，弧度制。玩家目前只有一个方向可旋转
}

export interface IPlayerState {
  name: string,
  profileID: number,
  x: number,
  y: number,
  z: number,
  h: number
}

const defaultPlayerParams = () => ({
  profileID: 0,
  h: 0,
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
  private _action: string = '';
  private _actionTime: number = 0;
  private assetManager: AssetManager;
  private _profileID: number | undefined;

  constructor(params: IPlayerParams, assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.obj = this._update(defaultPlayerParams(), params).obj;
  }

  public get state(): IPlayerParams {
    const { name, x, y, z, euler: { y: h } }  = this.object.state;
    const { profileID } = this;
    return { name, profileID, x, y, z, h }
  }

  public get object() {
    return this.obj;
  }

  public get name() { return this.state.name; }
  
  public get profileID() { return this._profileID; }

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

  public get action(){ return this._action; }

  public set action(name: string){
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

      action.fadeIn(0.5);
      action.play();
    }
	}

  public act(dt: number) { this.mixer && this.mixer.update(dt); }

  public get actionDuration() { return Date.now() - this._actionTime; }

  private _update(oldParams: IPlayerParams, params: IPlayerParams) {
    const { name, profileID, x, y, z, h } = assign(oldParams, params);

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
        self.action = Actions.IDLE;
        return Promise.resolve(self.assetManager);
      })
      .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
      .then((res) => obj.onLoad([res]));
    } 
    this.obj.update({ name, x, y, z, euler: { y: h } });
    return this;
  }
}