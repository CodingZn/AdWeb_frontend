import {  PointLight } from "three";
import { IRenderableParams, Renderable } from "./Renderable";

export interface ILightParams extends IRenderableParams {
  color?: number,
  intensity?: number,
  far?: number
}

export class Light extends Renderable {
  constructor(params: ILightParams) {
    super(params);
    const color = params.color === undefined ? 0xffffff : params.color;
    const light = new PointLight( color );

    light.intensity = params.intensity || 1.0;
    light.castShadow = true;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = params.far || 500;

    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.object.clear();
    this.object = light;
  }
}
