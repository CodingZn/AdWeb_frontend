import { assign } from "lodash";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { AssetManager } from "../managers/AssetManager";
import { IRenderableParams, Renderable } from "./Renderable";

export interface ITownParams extends IRenderableParams {}

export class Town extends Renderable {
  private assetManager: AssetManager;
  constructor(params: ITownParams, assetManager: AssetManager) {
    super(assign(params, { 
      isCollider: (child: Object3D) => {
        const mesh = child as Mesh;
        if (mesh.isMesh && mesh.name.startsWith("proxy")) {
          (mesh.material as MeshBasicMaterial).visible = false;
          return true;
        }
        return false;
      }
    }));
    this.assetManager = assetManager;
    const self = this;
    this.assetManager.get('fbx/town.fbx')
    .then(res => {
      self.onLoad([res]);
    })
  }
}