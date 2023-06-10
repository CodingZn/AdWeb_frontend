import { assign } from "lodash";
import {  AnimationClip, AnimationMixer, Object3D } from "three";
import { AssetManager } from "../managers/AssetManager";
import { AnimateMoveable, IAnimateMoveableParams, IAnimateMoveableState } from "../utils/AnimateMoveable";
import { defaultRenderableParams } from "../utils/Renderable";
import { ActionMap, Actions } from "../views/View";

export interface ICharacterParams extends IAnimateMoveableParams {
  name?: string,
  profileID?: number,
  x?: number,
  y?: number,
  z?: number,
  h?: number  // 朝向，弧度制
  pb?: number  // 仰俯 & 侧倾，弧度制
  action?: string,
}

export interface ICharacterState extends IAnimateMoveableState {
  name: string,
  profileID: number,
  x: number,
  y: number,
  z: number,
  h: number,
  pb: number,
  action: string,
}

export const defaultCharacterState: () => ICharacterState = () => ({
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

export abstract class Character extends AnimateMoveable {
  protected assetManager: AssetManager;
  protected characterObject: Object3D | null = null;
  protected _profileID: number = -1;

  constructor(params: ICharacterParams, assetManager: AssetManager) {
    super(assign({ actionMap: ActionMap }, params));
    this.assetManager = assetManager;
    this.idle = ActionMap.get(Actions.IDLE) as AnimationClip;
    this.update(assign(defaultCharacterState(), params));
  }

  public override get state(): ICharacterState {
    const { euler: { x: pb, y: h } } = super.state;
    const { profileID, action } = this;
    return assign({ profileID, h, pb, action }, super.state);
  }

  public get profileID() { return this._profileID; }

  public override move(dt: number, colliders?: Iterable<Object3D>) {
    // 根据动作更新速度
    if (this.action === Actions.RUNNING) {
      this.velocity = 50;
    } else {
      this.velocity = 20;
    }
    // 根据移动更新动作
    const { x, y, z } = super.move(dt, colliders);
    let action = Actions.IDLE;
    if (x !== 0 || z !== 0) {
      if (this.action === Actions.RUNNING ||
        (this.action === Actions.WALKING && this.actionDuration > 2000)) {
        action = Actions.RUNNING;
      } else {
        action = Actions.WALKING;
      }
    }
    this.action = action;
    return { x, y, z };
  }

  public override update(params: ICharacterParams) {
    const { profileID, action } = assign(this.state, params);
    if (profileID !== undefined && this._profileID !== profileID) {
      this._profileID = profileID;
      // 需要重新加载模型
      const profileName = ProfileMap[profileID as number];
      if (this.characterObject !== null) {
        this.characterObject.clear();
        this.characterObject = null;
      }
      const self = this;
      this.assetManager.get(`fbx/people/${profileName}.fbx`, { forceUpdate: true })
      .then((res) => {
        self.onLoad([res]);
        self.characterObject = res;
        self.idle = res.animations[0];
        res.mixer = self.mixer = new AnimationMixer(res);
        self.action = action;
        return Promise.resolve(self.assetManager);
      })
      .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
      .then((res) => self.onLoad([res]));
    } else {
      this.action = action;
    }
    super.update(params);
    return this;
  }
}  