
import { AssetManager } from "../managers/AssetManager";
import { Character, ICharacterParams } from "./Character";

export interface IPlayerParams extends ICharacterParams {}

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
}