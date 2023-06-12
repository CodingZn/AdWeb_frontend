import { DirectionalLight } from "three";
import { IPosition, IRenderableParams, Renderable } from "./Renderable";

export interface ILightParams extends IRenderableParams {
  color?: number,
  target?: IPosition
}

export class Light extends Renderable {
  constructor(params: ILightParams) { 
    super(params);
    const color = params.color === undefined ? 0xffffff : params.color;
    const light = new DirectionalLight( color );
    const { target } = params;
    light.target.position.set( target?.x || 0, target?.y || 0, target?.z || 0 )
    light.castShadow = true;
    const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
    light.shadow.camera.right = light.shadow.camera.top = lightSize;
    
    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.object.clear();
    this.object = light;
  }
}