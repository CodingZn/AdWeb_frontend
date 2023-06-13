
import { assign } from "lodash";
import { sgn } from "src/app/utils/function";
import { Vector3 } from "three";
import { AssetManager } from "../managers/AssetManager";
import { Moveable } from "../utils/Moveable";
import { IPosition, Renderable } from "../utils/Renderable";
import { Text } from "../utils/Text";
import { EYE_HEIGHT } from "./Character";
import { IPlayerParams, Player } from "./Player";

export interface ILocalPlayerParams extends IPlayerParams {}
export class LocalPlayer extends Player {
  private aim: Renderable;
  private _direction: IPosition | null = null;
  public focusedObject: Renderable | null = null;

  constructor(params: ILocalPlayerParams, assetManager: AssetManager) {
    super(assign(params, { nameColor: 0x00ff00 }), assetManager);
    this.aim = new Text({ content: '+', color: 0x0000ff, size: 5 }, assetManager);
  }

  /**
   *
   * 这里是包含了俯仰角度的
   * @memberof LocalPlayer
   */
  public override get direction() {
    return this._direction || super.direction;
  };
  public override set direction(v) {
    const dir = super.direction;
    const direction = new Vector3(dir.x, dir.y, dir.z);
    // 只有 xz 平面上的转动
    const target = new Vector3(v.x, v.y, v.z);
    direction.setY(0).normalize();
    target.setY(0).normalize();
    // 计算 xy 平面上的旋转弧度
		const rad = target.angleTo(direction) * sgn(direction.cross(target).y);
    if (Math.abs(rad) > 0.001) {
			this.transform({ rotateY: rad })
		}
    this._direction = v;
  };

  public checkFocus(colliders?: Iterable<Renderable>) {
    const dir = this.direction;
    let distance = 1000;
    let pos = this.object.position;
    pos = new Vector3(pos.x, EYE_HEIGHT + pos.y, pos.z);
    const intersect = Moveable.collide(
      pos,
      dir,
      Array.from(colliders || []).filter(v => v.uuid !== this.uuid),
      distance
    );

    // 调整准星
    this.aim.object.lookAt(pos);
    const { x, y, z } = pos.addScaledVector(new Vector3(dir.x, dir.y, dir.z), 100);
    this.aim.update({ x, y, z });
    this.parent?.add(this.aim.object);
    return intersect?.object || null;
  }

  public override move(dt: number, colliders?: Iterable<Renderable>) {
    const res = super.move(dt, colliders);
    const prevFocus = this.focusedObject;
    this.focusedObject = this.checkFocus(colliders);
    // console.log(prevFocus, this.focusedObject);
    if (prevFocus !== null && prevFocus !== this.focusedObject) {
      prevFocus.blur();
    }
    if (this.focusedObject !== null) this.focusedObject.focus();
    return res;
  }
}