import { CylinderGeometry, Mesh, MeshPhongMaterial } from "three";
import { IRenderable, Renderable } from "./Renderable";

export interface ICylinder extends IRenderable {
  radiusTop?: number,
  radiusBottom: number,
  height: number,
  color?: string
}

const defaultCylinderParams = {
  radiusTop: 0,
  color: '#ffffff'
}

export class Cylinder extends Renderable {
  constructor(params? :ICylinder) {
    const newParams = Object.assign(defaultCylinderParams, params);
    super(newParams);
    const { color, radiusTop, radiusBottom, height } = newParams;
    const geometry = new CylinderGeometry( radiusTop, radiusBottom, height, 64 );
    const material = new MeshPhongMaterial( { color } );
    const cylinder = new Mesh( geometry, material );
    this.add(cylinder);
  }
}