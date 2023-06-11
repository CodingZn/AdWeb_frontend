import { assign, random } from "lodash";
import {  AnimationClip, AnimationMixer, Event, Intersection, Mesh, Object3D, Vector3 } from "three";
import { AssetManager } from "../managers/AssetManager";
import { AnimateMoveable, IAnimateMoveableParams, IAnimateMoveableState } from "../utils/AnimateMoveable";
import { Moveable, RUNNING_VELOCITY, WALKING_VELOCITY, } from "../utils/Moveable";
import { defaultRenderableParams, Renderable } from "../utils/Renderable";
import { Text } from "../utils/Text";
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

export const CHARACTER_HEIGHT = 270;

export abstract class Character extends AnimateMoveable {
  protected assetManager: AssetManager;
  protected characterObject: Object3D | null = null;
  protected _profileID: number = -1;
  protected nameText: Text;

  constructor(params: ICharacterParams, assetManager: AssetManager) {
    super(assign({ actionMap: ActionMap }, params));
    this.assetManager = assetManager;
    this.idle = ActionMap.get(Actions.IDLE) as AnimationClip;
    this.nameText = new Text({ 
      content: this.name, 
      size: 20,
      height: 20,
      x: - this.name.length * 10,
      y: CHARACTER_HEIGHT + 30,
      color: random(0x0, 0xffffff)
    }, assetManager);
    this.add(this.nameText);
    this.update(assign(defaultCharacterState(), params));
  }

  public override get state(): ICharacterState {
    const { euler: { x: pb, y: h } } = super.state;
    const { profileID, action } = this;
    return assign({ profileID, h, pb, action }, super.state);
  }

  public override collide(colliders?: Iterable<Object3D<Event>> | undefined, dir?: { x?: number | undefined; y?: number | undefined; z?: number | undefined; } | undefined, distance?: number | undefined): Intersection<Object3D<Event>> | null {
    const { name, object } = this;
    const pos = new Vector3();
    pos.y = CHARACTER_HEIGHT * 0.6;
    object.getWorldPosition(pos);
    // 防止将自身当作障碍
    const filteredColliders = Array.from(colliders || []).filter(v => v.name !== name);
    if (dir !== undefined) {
      return Moveable.collide(pos, dir, filteredColliders, distance);
    } else {
      return Moveable.collide(pos, object.getWorldDirection(new Vector3()), filteredColliders, distance);
    }
  }

  public get profileID() { return this._profileID; }

  public override move(dt: number, colliders?: Iterable<Object3D>) {
    // 根据动作更新速度
    if (this.action === Actions.RUNNING) {
      this.velocity = RUNNING_VELOCITY;
    } else {
      this.velocity = WALKING_VELOCITY;
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
        res.mixer = self.mixer = new AnimationMixer(res);
        self.idle = res.animations[0];
        self.action = '';
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