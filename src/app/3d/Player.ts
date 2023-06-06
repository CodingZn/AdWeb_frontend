import { AssetManager } from "./managers/AssetManager";
import { Renderable, IRenderable, defaultRenderableParams, ITransformType } from "./utils/Renderable";

export interface IPlayerParams extends IRenderable {
  name?: string,
  profileID?: number,
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
    const obj = new Renderable(this.params);
    if (this.obj && this.obj.object.parent) {
      this.obj.object.parent.remove(this.obj.object);
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

  public transform(params: ITransformType) {
    this.transformParams = Object.assign(this.transformParams, params);
    this.object.transform(params);
    return this;
  }
}