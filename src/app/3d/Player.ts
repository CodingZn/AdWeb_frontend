import { ObjectManager } from "./utils/ObjectManager";
import { Renderable, IRenderable, defaultRenderableParams } from "./utils/Renderable";

export interface IPlayerParams extends IRenderable {
  name: string,
  profileID?: number,
}

const defaultPlayerParams = {
  profileID: 0,
  ...defaultRenderableParams
}

export const ProfileMap = [
  'Doctor',
  'BeachBabe',
  'FireFighter',
  'HouseWife',
  'Robber',
  'Policeman',
  'Prostitute',
  'Punk',
  'Waitress',
];

export class Player {
  private obj: Renderable;
  private objectManager: ObjectManager;
  private params: IPlayerParams = defaultPlayerParams;

  constructor(params: IPlayerParams, objectManager: ObjectManager) {
    this.objectManager = objectManager;
    this.obj = this.update(params);
  }

  public get object() {
    return this.obj;
  }

  public update(params: IPlayerParams) {
    this.params = Object.assign(this.params, params);
    const { name, profileID } = this.params;
    const profileName = ProfileMap[profileID as number];
    this.obj = this.objectManager.get(
      name, 
      {
        url: [
          `fbx/people/${profileName}.fbx`,
          `images/SimplePeople_${profileName}_Brown.png`
        ],
        ...this.params,
      },
      true);
      return this.obj;
  }
}