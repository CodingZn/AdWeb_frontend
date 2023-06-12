import { Raycaster, Vector3 } from "three";
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
  move: (dt: number, colliders?: Iterable<Renderable>) => any,
}

export class Moveable extends Renderable implements IMoveable {
  protected moveState: IMoveState = { forward: 0, right: 0, up: 0 };

  public static collide(pos: IPosition, dir: { x?: number, y?: number, z?: number }, renderables?: Iterable<Renderable>, distance?: number) {
    const dirVec = new Vector3(dir.x || 0, dir.y || 0, dir.z || 0).normalize();
    const raycaster = new Raycaster(new Vector3(pos.x, pos.y, pos.z), dirVec);
    const colliders = [];
    const map = new Map<string, Renderable>();
    if (renderables !== undefined) {
      for (const renderable of renderables) {
        for (const collider of renderable.colliders) {
          colliders.push(collider);
          map.set(collider.uuid, renderable);
        } 
      }
    }
    const intersect = raycaster.intersectObjects(colliders, false);
    if (intersect.length > 0 && intersect[0].distance < (distance || DISTANCE)) {
			const { object, distance } = intersect[0];
      return { 
        distance: distance,
        object: map.get(object.uuid)!,
        target: object,
        colliders,
        more: intersect,
       };
		} else {
      return null
    }
  }

  public collide(colliders?: Iterable<Renderable>, dir?: { x?: number, y?: number, z?: number }, distance?: number) {
    const { uuid, object } = this;
    const pos = new Vector3();
    object.getWorldPosition(pos);
    // 防止将自身当作障碍
    const filteredColliders = Array.from(colliders || []).filter(v => v.uuid !== uuid);
    if (dir !== undefined) {
      return Moveable.collide(pos, dir, filteredColliders, distance);
    } else {
      return Moveable.collide(pos, object.getWorldDirection(new Vector3()), filteredColliders, distance);
    }
  }

  public velocity: number = WALKING_VELOCITY;

  constructor(params: IMoveableParams) { super(params); }

  public onMove(moveState: IMoveState) { this.moveState = moveState; }

  public move(dt: number, renderables?: Iterable<Renderable>) {
    const { moveState: { forward, right, up } } = this;
    return this.moveTowards(dt, { right, forward }, renderables);
  }

  protected moveTowards(dt: number, dir: { forward?: number, right?: number, up?: number }, renderables?: Iterable<Renderable>) {
    const { object, velocity } = this;
    const { forward, right } = dir;
    let x = - (right || 0) * velocity * dt;
    let z = (forward || 0) * velocity * dt;
    let y = 0;
    const quaternion = object.quaternion.clone();
    
    if (x !== 0 || z !== 0) {
      const distance = DISTANCE;
      const dirVec = new Vector3(x, 0, z).normalize().applyQuaternion(quaternion).normalize();
      const intersect = this.collide(renderables, dirVec, distance);
      if (intersect !== null) {
        z = -sgn(z) *  (distance - intersect.distance) * (new Vector3(0, 0, z).normalize().applyQuaternion(quaternion).normalize().dot(dirVec));
        x = -sgn(x) *  (distance - intersect.distance) * (new Vector3(x, 0, 0).normalize().applyQuaternion(quaternion).normalize().dot(dirVec));
      }
    }
    this.transform({ translateX: x, translateY: y, translateZ: z });
    return { x, y, z };
  }
}