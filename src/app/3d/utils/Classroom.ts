import { METER } from "../characters/Character";
import { Box } from "./Box";
import { Light } from "./Light";
import { IRenderableParams, Renderable } from "./Renderable";
import { Wall } from "./Wall";

export const CLASSROOM_HEIGHT = 3 * METER;
export const CLASSROOM_WIDTH = 25 * METER;
export const CLASSROOM_DEPTH = 10 * METER;

export interface IClassroomParams extends IRenderableParams {}


/**
 *   y (height)
 *   |
 *   |________
 *   |\|____| \
 *   |_\_ _ _ _\___  x (width)
 * O \  \_______\
 *    \ |  _     | 
 *     \|_| |____|
 *      \
 *       z (depth)
 */
export class Classroom extends Renderable {
  private box: Box;
  private light: Light;
  constructor(params: IClassroomParams) { 
    super(params);
    this.box = new Box({
      width: CLASSROOM_WIDTH,
      height: CLASSROOM_HEIGHT,
      depth: CLASSROOM_DEPTH,
      sides: {
        front: {
          ctor: Wall,
          params: {
            // door
            windows: [
              {
                x: 1 * METER,
                y: 0,
                width: 1 * METER,
                height: 2 * METER
              }
            ]
          }
        },
        back: {
          ctor: Wall,
          params: {
            // door
            windows: [
              {
                x: 1 * METER,
                y: 1 * METER,
                width: CLASSROOM_WIDTH - 2 * METER,
                height: 1.5 * METER
              }
            ]
          }
        },
        bottom: {
          params: {
            color: 0x808080
          }
        }
      }
    });
    this.light = new Light({ 
      x: CLASSROOM_WIDTH / 2, 
      y: CLASSROOM_HEIGHT, 
      z: CLASSROOM_DEPTH / 2,
      target: {
        x: CLASSROOM_WIDTH / 2, 
        y: 0,
        z: CLASSROOM_DEPTH / 2  
      } 
    })
    this.add(this.box);
    this.add(this.light);
  }
}
