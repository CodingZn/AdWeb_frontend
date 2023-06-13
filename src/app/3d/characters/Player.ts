
import { assign } from "lodash";
import { AssetManager } from "../managers/AssetManager";
import { UpdatePlayerParams } from "../socket/model";
import { Character, ICharacterParams, ICharacterState } from "./Character";

export interface IPlayerUpdateParams extends ICharacterParams {
  id?: string,
  showName?: boolean,
}

export interface IPlayerParams extends IPlayerUpdateParams {
  id: string
}

export interface IPlayerState extends ICharacterState {
  id: string,
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
  protected _id: string;
  
  constructor(params: IPlayerParams, assetManager: AssetManager) {
    if (params.nameColor === undefined) {
      params.nameColor = 0x1e90ff;
    }
    super(params, assetManager);
    this._id = params.id;
  }

  public override update(params: IPlayerUpdateParams) {
    if (params.showName !== undefined) {
      this.nameText.update({ visible: params.showName })
    }
    return super.update(params);
  }

  public get id() { return this._id; }

  public override get state(): IPlayerState {
    const { id } = this;
    return assign(super.state, { id })
  }

  public toSocket(scene: string): UpdatePlayerParams {
    return assign(this.state, { visible: true, scene });
  }

  public fromSocket(player: UpdatePlayerParams) {
    this.update(player);
  }
}