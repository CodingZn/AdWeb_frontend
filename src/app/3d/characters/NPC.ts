import { Vector3 } from "three";
import { AssetManager } from "../managers/AssetManager";
import { Character, ICharacterParams } from "./Character";
import { Actions } from "../views/View";
import { random } from "lodash";
import { Renderable } from "../utils/Renderable";

export interface INPCParams extends ICharacterParams {}

export class NPC extends Character {
  constructor(params: INPCParams, assetManager: AssetManager) { 
    super(params, assetManager);
  }

  public override move(dt: number, colliders?: Iterable<Renderable>): { x: number; y: number; z: number; } {
    // 走累了就停一下
    if (this.actionDuration > 5000) {
        this.moveState.forward = this.action === Actions.IDLE ? 1 : 0;
    }
    // 目前只会向前走
    const { moveState: { forward }, velocity, object } = this;
    if (forward !== 0) {
      this.action = Actions.WALKING
    } else {
      this.action = Actions.IDLE;
    }
    const z = forward * velocity * dt;
    const quaternion = object.quaternion.clone();
    const dir = new Vector3(0, 0, z).applyQuaternion(quaternion);
    const intersect = this.collide(colliders, dir, 50)
    if (intersect !== null) {
      // todo 更加智能
      // 目前遇到障碍随机转身
      this.transform({ rotateY: random(-Math.PI, Math.PI, true) });    
    }
    this.transform({ translateZ: z });
    
    return { x: 0, y: 0, z };
  }
}