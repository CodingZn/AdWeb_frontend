
import { AssetManager } from "../managers/AssetManager";
import { Character, ICharacterParams } from "./Character";

export interface IPlayerParams extends ICharacterParams {
  showName?: boolean
}

export interface IPlayerState extends IPlayerParams {
  name: string,
  profileID: number,
  x: number,
  y: number,
  z: number,
  h: number,
  pb: number,
  action: string,
}

export class Player extends Character {
  constructor(params: IPlayerParams, assetManager: AssetManager) {
    super(params, assetManager);
  }

  public override update(params: IPlayerParams) {
    if (params.showName !== undefined) {
      this.nameText.update({ visible: params.showName })
    }
    return super.update(params);
  }
}