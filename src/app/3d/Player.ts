import { assign } from "lodash";
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

export interface IPlayerState {
  name: string,
  profileID: number,
  x: number,
  y: number,
  z: number,
  h: number
}

const defaultPlayerParams = () => ({
  profileID: 0,
  h: 0,
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
  private _profileID: number | undefined;

  constructor(params: IPlayerParams, assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.obj = this._update(defaultPlayerParams(), params).obj;
  }

  public get state(): IPlayerParams {
    const { name, x, y, z, euler: { y: h } }  = this.object.state;
    const { profileID } = this;
    return { name, profileID, x, y, z, h }
  }

  public get object() {
    return this.obj;
  }

  public get name() { return this.state.name; }
  
  public get profileID() { return this._profileID; }

  public update(params: IPlayerParams) {
    return this._update(this.state, params);
  }

  public move(params: { x?: number, y?: number, z?: number }) {
    const { x, y, z } = params;
    this.transform({ translateX: x || 0, translateY: y || 0, translateZ: z || 0 })
  }

  public transform(params: ITransformType) {
    this.object.transform(params);
    return this;
  }

  private _update(oldParams: IPlayerParams, params: IPlayerParams) {
    const { name, profileID, x, y, z, h } = assign(oldParams, params);

    if (this._profileID !== profileID) {
      this._profileID = profileID;
      // 需要重新加载模型
      const profileName = ProfileMap[profileID as number];
      const obj = new Renderable({ name });
      if (this.obj) {
        obj.copy(this.obj);
        this.obj.destory();
      }
      this.obj = obj;

      const self = this;
      this.assetManager.get(`fbx/people/${profileName}.fbx`, { forceUpdate: true })
      .then((res) => {
        obj.onLoad([res]);
        return Promise.resolve(self.assetManager);
      })
      .then(assetManager => assetManager.get(`images/SimplePeople_${profileName}_Brown.png`))
      .then((res) => obj.onLoad([res]));
    } 
    this.obj.update({ name, x, y, z, euler: { y: h } });
    return this;
  }
}