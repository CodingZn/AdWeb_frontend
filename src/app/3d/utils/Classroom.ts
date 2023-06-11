import { CHARACTER_HEIGHT } from "../characters/Character";
import { IRenderableParams, Renderable } from "./Renderable";

export const CLASSROOM_HEIGHT = 1.5 * CHARACTER_HEIGHT;

export interface IClassroomParams extends IRenderableParams {}

export class Classroom extends Renderable {
  constructor(params: IClassroomParams) { super(params)  }

}
