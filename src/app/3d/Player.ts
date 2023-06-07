import { AssetManager } from "./managers/AssetManager";
import { Renderable, defaultRenderableParams, ITransformType } from "./utils/Renderable";

export interface IPlayerParams {
  name?: string,
  profileID?: number,
  x?: number,
  y?: number,
  z?: number,
  h?: number  // 朝向，弧度制。玩家目前只有一个方向可旋转
}

const defaultPlayerParams = () => ({
  profileID: 0,
  ...defaultRenderableParams()
})

export const ProfileMap = [
  'Doctor',
  'BeachBabe',
  'FireFighter',
  'Robber',
  'Policeman',
  'Prostitute',
  'Punk',
  'Waitress',
];

export class Player {
  private obj: Renderable;
  private assetManager: AssetManager;
  private params: IPlayerParams = defaultPlayerParams();
  private transformParams: ITransformType = {};

  constructor(params: IPlayerParams, assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.obj = this.update(params).obj;
  }

  public get object() {
    return this.obj;
  }

  public get name() { return this.params.name; }
  
  public get profileID() { return this.params.profileID; }

  public update(params: IPlayerParams) {
    this.params = Object.assign(this.params, params);
    const { profileID } = this.params;
    const profileName = ProfileMap[profileID as number];
    const { name, x, y, z, h } = this.params;
    const obj = new Renderable({
      name, x, y, z, euler: { y: h }
    });
    if (this.obj && this.obj.parent) {
      this.obj.parent.remove(this.obj.object);
      obj.update(this.obj.state);
    }
    this.obj = obj;
    const self = this;

    this.assetManager.get(`fbx/people/${profileName}.fbx`)
    .then((res) => {
      obj.onLoad([res]);
      return Promise.resolve(self.assetManager);
    })
    .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
    .then((res) => {
      obj.onLoad([res]);
    });
    return this.transform(this.transformParams);
  }

  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    this.transform({ translateX: x || 0, translateY: y || 0, translateZ: z || 0 })
  }

  public transform(params: ITransformType) {
    this.transformParams = Object.assign(this.transformParams, params);
    this.object.transform(params);
    return this;
  }
}