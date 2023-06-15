import {Renderable} from "./Renderable";
import {CLASSROOM_DEPTH, CLASSROOM_HEIGHT, CLASSROOM_WIDTH, Desk, IClassroomParams} from "./Classroom";
import {Box} from "./Box";
import {Wall} from "./Wall";
import {METER} from "../characters/Character";
import {
  BoxGeometry,
  Material,
  Mesh,
  MeshBasicMaterial, MeshDepthMaterial,
  MeshLambertMaterial,
  MeshNormalMaterial, MeshToonMaterial,
  Object3D,
  Vector3
} from "three";
import {Light} from "./Light";
import {TEACHING_BUILDING_DEPTH, TEACHING_BUILDING_FLOOR_HEIGHT, TEACHING_BUILDING_WIDTH} from "./TeachingBuilding";
import {Cubes} from "./Cubes";
import {random} from "lodash";

const DELTA = 5;

const BORDER_INNER_LENGTH = 10 * METER;
const BORDER_HEIGHT = 0.2 * METER;
const BORDER_THICK = 0.1* METER;
const BORDER_LENGTH = BORDER_INNER_LENGTH + BORDER_THICK;

const CUBE_NUM = 40;
const CUBE_WIDTH = BORDER_INNER_LENGTH / CUBE_NUM;
const CUBE_HEIGHT = 0.1 * METER;

const CUBE_MAX_HEIGHT = 3*METER;

const CUBE_BASE_POS = new Vector3((CLASSROOM_WIDTH-BORDER_INNER_LENGTH)/2 + CUBE_WIDTH/2, 0, (CLASSROOM_DEPTH-BORDER_INNER_LENGTH)/2 + CUBE_WIDTH/2);


export class DistributionClassroom extends Renderable {
  private box: Box;
  private light: any;
  private _colliders: Set<Object3D> = new Set();
  // private desks: Desk[][];
  // private platform: Mesh;
  // private board: Mesh;
  private cubes: Cubes;

  public override get colliders() {
    return this._colliders;
  }


  constructor(params: IClassroomParams){
    super(params);
    this.box = new Box({
      width: CLASSROOM_WIDTH + DELTA,
      height: 2*CLASSROOM_HEIGHT + DELTA,
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

    // this.desks = [];
    // this.platform = new Mesh();
    // this.board = new Mesh();

    // this.box.add(this.platform);
    // this.box.add(this.board);

    let borders = [];
    let border_geo = new BoxGeometry( BORDER_LENGTH+BORDER_THICK, BORDER_HEIGHT, BORDER_THICK );
    let border_mesh = new Mesh(border_geo, new MeshNormalMaterial())
    border_mesh.position.set(CLASSROOM_WIDTH/2, BORDER_HEIGHT/2, CLASSROOM_DEPTH/2-BORDER_LENGTH/2);
    borders.push(border_mesh);

    border_mesh = new Mesh(border_geo, new MeshNormalMaterial())
    border_mesh.position.set(CLASSROOM_WIDTH/2, BORDER_HEIGHT/2, CLASSROOM_DEPTH/2+BORDER_LENGTH/2);
    borders.push(border_mesh);

    border_mesh = new Mesh(border_geo, new MeshNormalMaterial()).rotateY(Math.PI/2);
    border_mesh.position.set(CLASSROOM_WIDTH/2+BORDER_LENGTH/2, BORDER_HEIGHT/2, CLASSROOM_DEPTH/2);
    borders.push(border_mesh);

    border_mesh = new Mesh(border_geo, new MeshNormalMaterial()).rotateY(Math.PI/2);
    border_mesh.position.set(CLASSROOM_WIDTH/2-BORDER_LENGTH/2, BORDER_HEIGHT/2, CLASSROOM_DEPTH/2);
    borders.push(border_mesh);

    for (const border of borders) {
      this.box.add(border);
    }
    this.light = new Light({
      intensity: 2,
      x: CLASSROOM_DEPTH- DELTA,
      y: CLASSROOM_HEIGHT- DELTA,
      z: CLASSROOM_WIDTH- DELTA,
    });
    this.add(this.light)

    this.cubes = new Cubes();


  }

  public generateCubes(heights:number[][]){
    this.cleanCubes();
    for (let i = 0; i < CUBE_NUM; i++) {
      for (let j = 0; j < CUBE_NUM; j++) {
        let mesh: Mesh = new Mesh(new BoxGeometry(CUBE_WIDTH, heights[i][j]*CUBE_HEIGHT, CUBE_WIDTH),
          new MeshLambertMaterial({color: random(0x404080, 0x4040af)}));
        let pos:Vector3 = new Vector3().add(CUBE_BASE_POS)
          .add(new Vector3(CUBE_WIDTH*i, heights[i][j]*CUBE_HEIGHT/2, CUBE_WIDTH*j));
        mesh.position.add(pos);
        this.cubes.add(mesh);
      }
    }
    this.add(this.cubes)
  }

  public generateSampleCubes(){
    this.generateCubes(DistributionClassroom.generateSampleDistribution());
  }

  public cleanCubes(){
    // console.log("clean cubes");
    this.remove(this.cubes);
    this.cubes = new Cubes();
  }

  // max height: CUBE_NUM
  private static generateSampleDistribution(){
    let heights:number[][] = [];
    for (let i = 0; i < CUBE_NUM; i++) {
      heights[i] = [];
      for(let j=0; j<CUBE_NUM; j++){
        heights[i][j] = (i+j)/2;
      }
    }
    console.log(heights)
    return heights;
  }


}
