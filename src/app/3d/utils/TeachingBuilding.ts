import { Box } from "./Box";
import { Classroom, CLASSROOM_DEPTH, CLASSROOM_HEIGHT, CLASSROOM_WIDTH } from "./Classroom";
import { IRenderableParams, Renderable } from "./Renderable";

const DELTA =  5;

export const TEACHING_BUILDING_FLOOR_HEIGHT = CLASSROOM_HEIGHT + 2 * DELTA;
export const CLASSROOM_COUNT_PER_FLOOR = 5;
export const TEACHING_BUILDING_FLOOR_WIDTH = CLASSROOM_COUNT_PER_FLOOR * CLASSROOM_WIDTH;
export const TEACHING_BUILDING_FLOOR_DEPTH = 2 * CLASSROOM_DEPTH;

export const TEACHING_BUILDING_WIDTH = TEACHING_BUILDING_FLOOR_WIDTH;
export const TEACHING_BUILDING_DEPTH = TEACHING_BUILDING_FLOOR_DEPTH;

export interface ITeachingBuildingParams extends IRenderableParams {
  floors: number
}

export class TeachingBuilding extends Renderable {
  private box: Box;
  private floors: TeachingBuildingFloor[] = [];
  constructor(params: ITeachingBuildingParams) {
    super(params);
    this.box = new Box({ 
      width: TEACHING_BUILDING_WIDTH, 
      depth: TEACHING_BUILDING_DEPTH, 
      height: (TEACHING_BUILDING_FLOOR_HEIGHT + 2 * DELTA) * params.floors,
      sides: {
        front: { if: false },
        back:  { if: false },
        left:  { if: false },
        right: { if: false },
      }
    });
    for (let i = 0; i < params.floors; i++) {
      this.floors.push(new TeachingBuildingFloor({ y: i * TEACHING_BUILDING_FLOOR_HEIGHT + DELTA }));
    }
    for (const floor of this.floors) {
      this.box.add(floor);
    }
    this.add(this.box);
  }
}

interface ITeachingBuildingFloorParams extends IRenderableParams {}
class TeachingBuildingFloor extends Renderable {
  private box: Box;
  private classrooms: Classroom[] = [];
  
  constructor(params: ITeachingBuildingFloorParams) {
    super(params);
    this.box = new Box({ 
      width: TEACHING_BUILDING_FLOOR_WIDTH, 
      height: TEACHING_BUILDING_FLOOR_HEIGHT, 
      depth: TEACHING_BUILDING_FLOOR_DEPTH,
      sides: {
        front: { if: false },
        back:  { if: false },
        left:  { if: false },
        right: { if: false },
        bottom: { params: { color: 0x808080 } }
      }
    });
    for (let i = 0; i < CLASSROOM_COUNT_PER_FLOOR; i++) {
      this.classrooms.push(new Classroom({ x: i * CLASSROOM_WIDTH, y: DELTA }));
    }
    for(const classroom of this.classrooms) {
      this.box.add(classroom);
    }
    this.add(this.box);
  }
}