import { Object3D, Raycaster, Vector3 } from "three";
import { sgn } from "../../utils/function";
import { IRenderableParams, IRenderableState, Renderable } from "./Renderable";

export interface IMoveableParams extends IRenderableParams {};

export interface IMoveableState extends IRenderableState {}

export interface IMoveState {
  forward: number,
  right: number,
  up: number,
}

export interface IMoveable {
  velocity: number,
  onMove: (moveState: IMoveState) => any,
  move: (dt: number, colliders?: Iterable<Object3D>) => any,
}

export class Moveable extends Renderable implements IMoveable {
  protected moveState: IMoveState = { forward: 0, right: 0, up: 0 };

  public collide(colliders?: Iterable<Object3D>, dir?: { x?: number, y?: number, z?: number }, distance?: number) {
    const { object } = this;
    const pos = new Vector3();
    object.getWorldPosition(pos);
    const dirVec = new Vector3();
    if (dir !== undefined) {
      dirVec.set(dir.x || 0, dir.y || 0, dir.z || 0);
    } else {
      object.getWorldDirection(dirVec);
    }
    dirVec.normalize();
    const raycaster = new Raycaster(pos, dirVec);
    const intersect = raycaster.intersectObjects(Array.from(colliders || []));
    if (intersect.length > 0 && intersect[0].distance < (distance || 10)) {
			return intersect[0];
		} else {
      return null;
    }
  }

  public velocity: number = 20;

  constructor(params: IMoveableParams) { super(params); }

  public onMove(moveState: IMoveState) { this.moveState = moveState; }

  public move(dt: number, colliders?: Iterable<Object3D>) {
    const { moveState: { forward, right, up }, velocity, object } = this;
    const quaternion = object.quaternion.clone();
    let x = 0, y = 0, z = 0;
    if (forward !== 0) {
      z = forward * velocity * dt;
      const dir = new Vector3(0, 0, z).applyQuaternion(quaternion);
      const intersect = this.collide(colliders, dir, 20)
      if (intersect !== null) {
        z = -sgn(z) *  (20 - intersect.distance);
      }
    }
    if (right !== 0) {
      x = - right * velocity * dt;
      const dir = new Vector3(x, 0, 0).applyQuaternion(quaternion);
      const intersect = this.collide(colliders, dir, 20)
      if (intersect !== null) {
        x = -sgn(x) *  (20 - intersect.distance);
      }
    }
    this.transform({ translateX: x, translateY: y, translateZ: z });
    return { x, y, z }
  }
}