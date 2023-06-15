import { assign } from "lodash";
import {  AnimationClip, AnimationMixer, CylinderGeometry, DoubleSide, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, Texture, Vector3 } from "three";
import { AssetManager } from "../managers/AssetManager";
import { AnimateMoveable, IAnimateMoveableParams, IAnimateMoveableState } from "../utils/AnimateMoveable";
import { cachedGeometry, cachedMaterial } from "../utils/cache";
import { Moveable, RUNNING_VELOCITY, WALKING_VELOCITY, } from "../utils/Moveable";
import { defaultRenderableParams, Renderable } from "../utils/Renderable";
import { SpeechBubble } from "../utils/SpeechBubble";
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
  nameColor?: number
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
export const EYE_HEIGHT = 0.8 * CHARACTER_HEIGHT;
export const METER = CHARACTER_HEIGHT / 1.7;
export const STEP_OVER_HEIGHT = 50;

export abstract class Character extends AnimateMoveable {
  protected assetManager: AssetManager;
  protected characterObject: Object3D | null = null;
  protected _profileID: number = -1;
  protected nameText: Text;
  protected outline: Mesh;
  private speechBubble: SpeechBubble;
  private speechTimer: any | null = null;

  constructor(params: ICharacterParams, assetManager: AssetManager) {
    super(assign({ actionMap: ActionMap }, params));
    this.assetManager = assetManager;
    this.idle = ActionMap.get(Actions.IDLE) as AnimationClip;
    this.nameText = new Text({ 
      content: this.name, 
      x: - this.name.length * 10,
      y: CHARACTER_HEIGHT + 30,
      color: params.nameColor || 0
    }, assetManager);
    this.add(this.nameText);
    this.update(assign(defaultCharacterState(), params));
    this.outline = new Mesh(
      cachedGeometry(CylinderGeometry, 0.5 * METER, 0.5 * METER, 1, 64),
      cachedMaterial(MeshLambertMaterial, 0x0000ff)
    );
    const out = new Mesh(
      cachedGeometry(CylinderGeometry, 1 * METER, 0.5 * METER, METER, 64),
      new MeshLambertMaterial({ color: 0x3d4ff, transparent: true, opacity: 0.3, side: DoubleSide })
    );
    out.position.set(0, 0.5 * METER, 0);
    this.outline.add(out);
    this.outline.name = 'outline'
    this.speechBubble = new SpeechBubble(
      { name: 'speechBubble' }, 
      this.assetManager)
    .update({ y: CHARACTER_HEIGHT + 0.5 * METER });
  }

  public override get state(): ICharacterState {
    const { euler: { x: pb, y: h } } = super.state;
    const { profileID, action } = this;
    return assign({ profileID, h, pb, action }, super.state);
  }

  public override collide(colliders?: Iterable<Renderable>, dir?: { x?: number; y?: number; z?: number; }, distance?: number) {
    const { uuid, object } = this;
    const pos = new Vector3();
    object.getWorldPosition(pos);
    pos.y += STEP_OVER_HEIGHT;
    
    // 防止将自身当作障碍
    const filteredColliders = Array.from(colliders || []).filter(v => v.uuid !== uuid);
    if (dir !== undefined) {
      return Moveable.collide(pos, dir, filteredColliders, distance);
    } else {
      return Moveable.collide(pos, object.getWorldDirection(new Vector3()), filteredColliders, distance);
    }
  }

  public get profileID() { return this._profileID; }

  public override move(dt: number, colliders?: Iterable<Renderable>) {
    // 根据动作更新速度
    if (this.action === Actions.RUNNING) {
      this.velocity = RUNNING_VELOCITY;
    } else {
      this.velocity = WALKING_VELOCITY;
    }
    // 根据移动更新动作
    const { x, z } = super.move(dt, colliders);
    let y = 0;
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
    // down
    const filteredColliders = Array.from(colliders || []).filter(v => v.uuid !== this.uuid);
    const pos = new Vector3();
    this.object.getWorldPosition(pos);
    pos.y += STEP_OVER_HEIGHT;
    const intersect = Moveable.collide(
      pos, 
      new Vector3(0, -1, 0), 
      filteredColliders, 
      Infinity
      );
    y = 0;
    if (intersect !== null) {
      let targetY = pos.y - intersect.distance;
      const { y: curY } = this.state;
      // const newY = 0.8 * curY + 0.2 * targetY;
      const newY = targetY;
      y = newY - curY;
      this.update({ y: newY });
    }
    
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
        super.update(this.state);
        return Promise.resolve(self.assetManager);
      })
      .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
      .then((res) => self.onLoad([res]))
      .catch(e => console.log(e));
    } else {
      this.action = action;
      super.update(params);
    }
    return this;
  }

  public override focus() {
    this.add(this.outline);
  }

  public override blur() {
    this.remove(this.outline);
  }

  /**
   * 
   * @param message 
   * @param time 单位：秒
   */
  public say(message: string, time: number = 5) {
    this.speechBubble.update({ message });
    if (this.speechTimer !== null) {
      clearTimeout(this.speechTimer);
    } else {
      this.add(this.speechBubble);
    }
    this.speechTimer = setTimeout(() => {
      this.remove(this.speechBubble);
      this.speechTimer = null;
    }, time * 1000);
  }

  public override onLoad(resources: any[]) {
    const self = this;
    const objects: Object3D[] = [];
    let texture: Texture | undefined;
    resources.forEach((res: any) => {
      if (res.isObject3D) {
        objects.push(res);
      } else if (res.isTexture) {
        texture = res;
      }
    })

    objects.forEach(object => {
      self.add(object);
    })

    this.object.traverse((child: Object3D) => {
      if ( 
        (child as any).isMesh 
        && child.name !== this.outline.name
        && child.name !==this.speechBubble.name  
      ) {
        const mesh = child as Mesh;
        const material = mesh.material as MeshBasicMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (texture !== undefined) {
          material.map = texture;
        }
      }
    });
    return this;
  }
}  