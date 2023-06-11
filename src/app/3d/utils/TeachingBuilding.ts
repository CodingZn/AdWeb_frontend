import { CLASSROOM_HEIGHT } from "./Classroom";
import { IRenderableParams, Renderable } from "./Renderable";

export const TEACHING_BUILDING_FLOOR_HEIGHT = CLASSROOM_HEIGHT;

export interface ITeachingBuildingParams extends IRenderableParams {
  floors: number
}
interface ITeachingBuildingFloorParams extends IRenderableParams {}

export class TeachingBuilding extends Renderable {
  private floors: TeachingBuildingFloor[] = [];
  constructor(params: ITeachingBuildingParams) {
    super(params);
    for (let i = 0; i < params.floors; i++) {
      this.floors.push(new TeachingBuildingFloor({ y: i * TEACHING_BUILDING_FLOOR_HEIGHT }));
    }
    for (const floor of this.floors) {
      this.add(floor);
    }
  }
}

export class TeachingBuildingFloor extends Renderable {
  constructor(params: ITeachingBuildingFloorParams) {
    super(params);

  }
}
