import { AssetManager } from "./managers/AssetManager";
import { IPlayerParams, Player } from "./Player";

export interface ILocalPlayerParams extends IPlayerParams {}

export class LocalPlayer extends Player {
  constructor(params: ILocalPlayerParams, assetManager: AssetManager) {
    super(params, assetManager);
  }
}