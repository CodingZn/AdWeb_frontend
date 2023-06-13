import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshLambertMaterial, MeshPhongMaterial, Object3D } from "three";
import { METER, STEP_OVER_HEIGHT } from "../characters/Character";
import { Box } from "./Box";
import { cachedGeometry, cachedMaterial } from "./cache";
import { IRenderableParams, Renderable } from "./Renderable";
import { Wall } from "./Wall";

const DELTA = 5;
export const CLASSROOM_HEIGHT = 3.5 * METER;
export const CLASSROOM_WIDTH = 20 * METER;
export const CLASSROOM_DEPTH = 15 * METER;

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

export const SILVER_MATERIAL = new MeshPhongMaterial({ color: 0xc0c0c0, side: DoubleSide });
export const WOODEN_MATERIAL = new MeshLambertMaterial({ color: 0xdeb887, side: DoubleSide });
export class Classroom extends Renderable {
  private box: Box;
  private desks: Desk[][];
  private platform: Mesh;
  private board: Mesh;
  private _colliders: Set<Object3D> = new Set();

  public override get colliders() {
    return this._colliders;
  } 

  constructor(params: IClassroomParams) { 
    super(params);
    this.box = new Box({
      width: CLASSROOM_WIDTH + DELTA,
      height: CLASSROOM_HEIGHT + DELTA,
      depth: CLASSROOM_DEPTH + DELTA,
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
              },
              {
                x: CLASSROOM_WIDTH - 2 * METER,
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
            windows: [
              {
                x: METER,
                y: METER,
                width: 1.5 * METER,
                height: CLASSROOM_HEIGHT - METER,
              },
              {
                x: CLASSROOM_WIDTH / 2 - 1.5 * METER,
                y: METER,
                width: 1.5 * METER,
                height: CLASSROOM_HEIGHT - METER,
              },
              {
                x: CLASSROOM_WIDTH - 2.5 * METER,
                y: METER,
                width: 1.5 * METER,
                height: CLASSROOM_HEIGHT - METER,
              },
            ]
          }
        },
        bottom: {
          params: {
            color: 0x808080
          }
        }
      },
      isCollider: true
    });
    this.add(this.box);
    for (const collider of this.box.colliders) {
      this._colliders.add(collider);
    }

    // 讲台
    const platformWidth = CLASSROOM_DEPTH - 4 * METER;
    const platformHeight = 0.6 * STEP_OVER_HEIGHT;
    const platformDepth = 2 * METER;
    this.platform = new Mesh(
      cachedGeometry(
        BoxGeometry,
        platformDepth,
        platformHeight,
        platformWidth,
      ),
      WOODEN_MATERIAL
    );
    this.platform.position.set(DELTA / 2 + platformDepth / 2, DELTA / 2 + platformHeight / 2, DELTA / 2 + 2 * METER + platformWidth / 2)
    const box = new Mesh(
      cachedGeometry(
        BoxGeometry,
        1 * METER,
        1 * METER,
        2 * METER,
      ),
      SILVER_MATERIAL
    );
    box.position.set(METER / 2, platformHeight / 2 + METER / 2, 0);
    this.platform.add(box);
    this.box.add(this.platform);
    this._colliders.add(this.platform);
    this._colliders.add(box);

    // 黑板
    this.board = new Mesh(
      cachedGeometry(
        BoxGeometry, 
        0.1 * METER,
        2 * METER,
        platformWidth),
      cachedMaterial(MeshLambertMaterial, 0x000000)
    );
    this.board.position.set(DELTA / 2 + 0.06 * METER, DELTA / 2 + 2 * METER, DELTA / 2 + CLASSROOM_DEPTH / 2);
    this.box.add(this.board);
    this._colliders.add(this.board);

    // 座位
    const COLS = 3;
    const ROWS = 5;
    const DESK_WIDTH = 4 * METER;
    const DESK_DEPTH = 0.8 * METER;
    const LR_DELTA = (CLASSROOM_DEPTH - DESK_WIDTH * COLS) / (COLS - 1);
    const FB_DELTA = 1.2 * METER;
    this.desks = new Array<Array<Desk>>(COLS);
    for (let i = 0; i < COLS; i++) {
      this.desks[i] = new Array<Desk>(ROWS); 
      for (let j = 0; j < ROWS; j++) {
        const desk = new Desk({ 
          width: DESK_WIDTH, 
          depth: DESK_DEPTH,
          x: DELTA / 2 + platformDepth + 2 * METER + j * (DESK_DEPTH + FB_DELTA),
          z: DELTA / 2 + i * (DESK_WIDTH + LR_DELTA), 
          y: DELTA / 2, 
        })
        .transform({ rotateY: Math.PI / 2 })
        .transform({ translateX: - DESK_WIDTH });
        this.desks[i][j] = desk;
        this.add(desk);
        desk.addChair(0.8 * METER);
      }
    }
  }
}

export interface IDeskParams extends IRenderableParams {
  width: number,
  depth: number,
}

export class Desk extends Renderable {
  private width: number;
  private depth: number;

  constructor(params: IDeskParams) { 
    super(params);
    const { width, depth } = params;
    this.width = width;
    this.depth = depth;
    const padding = 0.05 * METER;
    const legRadius = 0.05 * METER;
    const legHeight = 0.7 * METER;
    const topWidth = width;
    const topDepth = depth;
    const topHeight = 0.05 * METER;
    const bodyWidth = width - 2 * padding;
    const bodyDepth = topDepth - 2 * padding;
    const bodyHeight = 0.3 * METER;
    const frontDepth = topHeight + bodyHeight + 0.3 * legHeight;
    const bodyAndLeg = new Group();
    bodyAndLeg.position.set(padding, 0, topHeight);
    // 桌子抽屉
    const body = new Box({
      width: bodyWidth,
      height: bodyHeight,
      depth: bodyDepth,
      material: MeshPhongMaterial,
      sides: { 
        front: { if: false },
        back: { if: false },
        top: { if: false }
      },
      color: 0xc0c0c0,
    });
    body.update({ y: legHeight });
    bodyAndLeg.add(body.object);
    // 四只桌腿
    const legs = new Group();
    for (let i = 0; i < 4; i++) {
      const leg = new Mesh(
        cachedGeometry(CylinderGeometry, legRadius, legRadius, legHeight, 64),
        SILVER_MATERIAL
      );
      legs.add(leg);
      if (i === 0 || i === 1) leg.position.setZ(legRadius);
      if (i === 2 || i === 3) leg.position.setZ(bodyDepth - legRadius);
      if (i === 0 || i === 3) leg.position.setX(legRadius);
      if (i === 1 || i === 2) leg.position.setX(bodyWidth - legRadius);
    }
    legs.position.set(0, legHeight / 2, 0);
    bodyAndLeg.add(legs);
    // 桌面
    const top = new Mesh(
      cachedGeometry(BoxGeometry, topWidth, topDepth, topHeight),
      WOODEN_MATERIAL
    );
    top.position.set(topWidth / 2 , bodyHeight + legHeight, topHeight + topDepth / 2)
    top.rotateX(Math.PI / 2);
    // 前挡板
    const front = new Mesh(
      cachedGeometry(BoxGeometry, width, frontDepth, topHeight),
      WOODEN_MATERIAL
    );
    front.position.set(topWidth / 2, bodyHeight + legHeight - frontDepth / 2 + topHeight / 2, topHeight / 2);
    
    this.add(top);
    this.add(front);
    this.add(bodyAndLeg);
  }

  public addChair(width: number, depth?: number, height?: number) {
    const count = Math.floor(this.width / width);
    const margin = (this.width - count * width) / (count + 1);
    depth = depth || width;
    for (let i = 0; i < count; i++) {
      const chair = new Chair({
        width,
        depth,
        height,
        z: this.depth,
        x: (i + 1) * margin + i * width
      })
      .transform({ rotateY: Math.PI })
      .transform({ translateZ: - depth, translateX: - width  })
      this.add(chair);
    } 
  }
}

export interface IChairParams extends IRenderableParams {
  width: number,
  depth: number,
  height?: number
}

export class Chair extends Renderable {
  constructor(params: IChairParams) { 
    super(params);
    const { width, depth, height } = params;
    const padding = 0.05 * METER;
    const topHeight = 0.05 * METER;
    const backDepth = depth;
    const legRadius = 0.05 * METER;
    const legHeight = height || 0.5 * METER;
    const top = new Mesh(
      cachedGeometry(BoxGeometry, width, depth, topHeight),
      WOODEN_MATERIAL
    );
    top.position.set(width / 2, legHeight, depth / 2);
    top.rotateX(Math.PI / 2);
    const back = new Mesh(
      cachedGeometry(BoxGeometry, width, backDepth, topHeight),
      WOODEN_MATERIAL
    );
    back.position.set(width / 2, legHeight + backDepth / 2, topHeight / 2);
    back.rotateX(- Math.PI / 180 * 15);
    const legs = new Group();
    for (let i = 0; i < 4; i++) {
      const leg = new Mesh(
        cachedGeometry(CylinderGeometry, legRadius, legRadius, legHeight, 64),
        SILVER_MATERIAL
      );
      legs.add(leg);
      if (i === 0 || i === 1) leg.position.setZ(legRadius);
      if (i === 2 || i === 3) leg.position.setZ(depth - 2 * padding - legRadius);
      if (i === 0 || i === 3) leg.position.setX(legRadius);
      if (i === 1 || i === 2) leg.position.setX(width - 2 * padding - legRadius);
    }
    legs.position.set(padding, legHeight / 2, padding);
    this.add(top);
    this.add(back);
    this.add(legs);
  }
}
