import { AssetManager } from "../managers/AssetManager";
import { Character, ICharacterParams } from "./Character";

export interface INPCParams extends ICharacterParams {}

export class NPC extends Character {
  constructor(params: INPCParams, assetManager: AssetManager) { 
    super(params, assetManager);
  }

  
}