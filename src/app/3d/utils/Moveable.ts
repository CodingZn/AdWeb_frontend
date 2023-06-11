import { Object3D, Raycaster, Vector3 } from "three";
import { sgn } from "../../utils/function";
import { IPosition, IRenderableParams, IRenderableState, Renderable } from "./Renderable";

export interface IMoveableParams extends IRenderableParams {};

export interface IMoveableState extends IRenderableState {}

export interface IMoveState {
  forward: number,
  right: number,
  up: number,
}

export const DISTANCE = 50;
export const WALKING_VELOCITY = 200;
export const RUNNING_VELOCITY = 500;

export interface IMoveable {
  velocity: number,
  onMove: (moveState: IMoveState) => any,
  move: (dt: number, colliders?: Iterable<Object3D>) => any,
}

export class Moveable extends Renderable implements IMoveable {
  protected moveState: IMoveState = { forward: 0, right: 0, up: 0 };

  public static collide(pos: IPosition, dir: { x?: number, y?: number, z?: number }, colliders?: Iterable<Object3D>, distance?: number) {
    const dirVec = new Vector3(dir.x || 0, dir.y || 0, dir.z || 0).normalize();
    const raycaster = new Raycaster(new Vector3(pos.x, pos.y, pos.z), dirVec);
    const intersect = raycaster.intersectObjects(Array.from(colliders || []), false);
    if (intersect.length > 0 && intersect[0].distance < (distance || DISTANCE)) {
			return intersect[0];
		} else {
      return null;
    }
  }

  public collide(colliders?: Iterable<Object3D>, dir?: { x?: number, y?: number, z?: number }, distance?: number) {
    const { name, object } = this;
    const pos = new Vector3();
    object.getWorldPosition(pos);
    // 防止将自身当作障碍
    const filteredColliders = Array.from(colliders || []).filter(v => v.name !== name);
    if (dir !== undefined) {
      return Moveable.collide(pos, dir, filteredColliders, distance);
    } else {
      return Moveable.collide(pos, object.getWorldDirection(new Vector3()), filteredColliders, distance);
    }
  }

  public velocity: number = WALKING_VELOCITY;

  constructor(params: IMoveableParams) { super(params); }

  public onMove(moveState: IMoveState) { this.moveState = moveState; }



  public move(dt: number, colliders?: Iterable<Object3D>) {
    const { moveState: { forward, right, up } } = this;
    return this.moveTowards(dt, { right, forward }, colliders);
  }

  protected moveTowards(dt: number, dir: { forward?: number, right?: number, up?: number }, colliders?: Iterable<Object3D>) {
    const { object, velocity } = this;
    const { forward, right } = dir;
    let x = - (right || 0) * velocity * dt;
    let z = (forward || 0) * velocity * dt;
    let y = 0;
    const quaternion = object.quaternion.clone();
    
    if (x !== 0 || z !== 0) {
      const distance = DISTANCE;
      const dirVec = new Vector3(x, 0, z).normalize().applyQuaternion(quaternion).normalize();
      const intersect = this.collide(colliders, dirVec, distance);
      if (intersect !== null) {
        z = -sgn(z) *  (distance - intersect.distance) * (new Vector3(0, 0, z).normalize().applyQuaternion(quaternion).normalize().dot(dirVec));
        x = -sgn(x) *  (distance - intersect.distance) * (new Vector3(x, 0, 0).normalize().applyQuaternion(quaternion).normalize().dot(dirVec));
      }
    }
    this.transform({ translateX: x, translateY: y, translateZ: z });
    return { x, y, z };
  }
}