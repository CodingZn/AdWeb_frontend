import { Object3D } from "three";
import { METER, STEP_OVER_HEIGHT } from "../characters/Character";
import { Box } from "./Box";
import { Classroom, CLASSROOM_DEPTH, CLASSROOM_HEIGHT, CLASSROOM_WIDTH } from "./Classroom";
import { Light } from "./Light";
import { IRenderableParams, Renderable } from "./Renderable";
import { Stairs } from "./Stairs";
import { Wall } from "./Wall";

const DELTA =  20;

export const TEACHING_BUILDING_FLOOR_HEIGHT = CLASSROOM_HEIGHT + 2 * DELTA;
export const CLASSROOM_COUNT_PER_FLOOR = 5;
export const TEACHING_BUILDING_FLOOR_WIDTH = CLASSROOM_COUNT_PER_FLOOR * (CLASSROOM_WIDTH + DELTA);
export const TEACHING_BUILDING_FLOOR_DEPTH = 2 * (CLASSROOM_DEPTH + DELTA) + 10 * METER;

export const TEACHING_BUILDING_WIDTH = TEACHING_BUILDING_FLOOR_WIDTH;
export const TEACHING_BUILDING_DEPTH = TEACHING_BUILDING_FLOOR_DEPTH;

export interface ITeachingBuildingParams extends IRenderableParams {
  floors: number,
}

export class TeachingBuilding extends Renderable {
  private box: Box;
  private light: Light;
  private floors: TeachingBuildingFloor[] = [];
  private _colliders: Set<Object3D> = new Set();

  public override get colliders() {
    return this._colliders;
  }

  constructor(params: ITeachingBuildingParams) {
    super(params);
    this.box = new Box({ 
      width: TEACHING_BUILDING_WIDTH, 
      depth: TEACHING_BUILDING_DEPTH, 
      height: TEACHING_BUILDING_FLOOR_HEIGHT * params.floors,
      sides: {
        front: { if: false },
        back:  { if: false },
      },
      isCollider: true
    });
    for (const collider of this.box.colliders) {
      this._colliders.add(collider);
    }
    this.light = new Light({
      intensity: 1,
      x: TEACHING_BUILDING_WIDTH / 2, 
      y: TEACHING_BUILDING_FLOOR_HEIGHT * params.floors, 
      z: TEACHING_BUILDING_DEPTH / 2,
    });
    this.box.add(this.light);
    for (let i = 0; i < params.floors; i++) {
      this.floors.push(new TeachingBuildingFloor({ 
        isBottom: i === 0,
        isTop: i === params.floors - 1,
        y: i * TEACHING_BUILDING_FLOOR_HEIGHT + DELTA 
      }));
    }
    for (const floor of this.floors) {
      this.box.add(floor);
      for (const collider of floor.colliders) {
        this._colliders.add(collider);
      }
    }
    this.add(this.box);
  }
}

interface ITeachingBuildingFloorParams extends IRenderableParams {
  isBottom?: boolean
  isTop?: boolean
}
class TeachingBuildingFloor extends Renderable {
  private box: Box;
  private stairs: Stairs | null = null;
  private classrooms: Classroom[] = [];
  private _colliders: Set<Object3D> = new Set();

  public override get colliders() {
    return this._colliders;
  }
  
  constructor(params: ITeachingBuildingFloorParams) {
    super(params);
    const stairsPos = { 
      x: 4 * METER, 
      z: CLASSROOM_DEPTH + 7 * METER }
    const stairsSize = { 
      width: 4 * METER,
      depth: 5 * METER, 
      height: TEACHING_BUILDING_FLOOR_HEIGHT, 
      stepHeight: STEP_OVER_HEIGHT - 1 }
    this.box = new Box({
      width: TEACHING_BUILDING_FLOOR_WIDTH, 
      height: TEACHING_BUILDING_FLOOR_HEIGHT, 
      depth: TEACHING_BUILDING_FLOOR_DEPTH,
      sides: {
        front:  { if: false },
        back:   { if: false },
        left:   { if: false },
        right:  { if: false },
        top:    { if: false },
        bottom: { ctor: Wall, params: { 
            color: 0x808080,
            windows: params.isBottom ? [] : [{
              x: stairsPos.x, 
              y: stairsPos.z - stairsSize.width,
              width: stairsSize.depth,
              height: stairsSize.width
            }]
          } 
        },
      },
      isCollider: true
    });
    for (const collider of this.box.colliders) {
      this._colliders.add(collider);
    }
    for (let i = 0; i < CLASSROOM_COUNT_PER_FLOOR; i++) {
      this.classrooms.push(new Classroom({
        x:  i * (CLASSROOM_WIDTH + DELTA / 2), 
        y: DELTA,
      }));
      this.classrooms.push(new Classroom({
        x:  i * (CLASSROOM_WIDTH + DELTA / 2) + CLASSROOM_WIDTH, 
        y: DELTA,
        z: TEACHING_BUILDING_DEPTH,
      }).transform({ rotateY: Math.PI }));
    }
    for(const classroom of this.classrooms) {
      this.box.add(classroom);
      for (const collider of classroom.colliders) {
        this._colliders.add(collider);
      }
    }
    if (!params.isTop) {
      this.stairs = new Stairs({
        ...stairsSize,
        ...stairsPos,
        color: 0x808080,
        isCollider: true
      }).transform({ rotateY: Math.PI / 2 });
      for (const collider of this.stairs.colliders) {
        this._colliders.add(collider);
      }
      this.add(this.stairs);
    }
    this.add(this.box);
  }
}