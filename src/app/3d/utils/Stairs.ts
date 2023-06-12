import { Box } from "./Box";
import { IRenderableParams, Renderable } from "./Renderable";

export interface IStairsParam extends IRenderableParams {
  height: number;
  width: number;
  stepHeight: number;
  depth?: number;
  color?: number
}

export class Stairs extends Renderable {
  private steps: Box[];
  constructor(params: IStairsParam) {
    super(params);
    const { width, height, color } = params;
    let stepHeight = params.stepHeight;
    const stepCount = Math.ceil(height / stepHeight);
    stepHeight = height / stepCount;
    let stepDepth = params.depth !== undefined ? params.depth / stepCount : 50;
    this.steps = Array<Box>(stepCount);
    for (let i = 0; i < stepCount; i++) {
      const step = new Box({ 
        width, 
        height: stepHeight, 
        depth: 2 * stepDepth,
        z: i * stepDepth,
        y: i * stepHeight,
        color
      });
      this.add(step);
      this.steps.push(step);
    } 
  }
}