
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
  protected id: string;
  constructor(params: IPlayerParams, assetManager: AssetManager) {
    super(params, assetManager);
    this.id = params.id;
  }

  public override update(params: IPlayerUpdateParams) {
    if (params.showName !== undefined) {
      this.nameText.update({ visible: params.showName })
    }
    return super.update(params);
  }

  public override get state(): IPlayerState {
    const { id } = this;
    return assign(super.state, { id })
  }

  public toSocket(): UpdatePlayerParams {
    return assign(this.state, { visible: true });
  }

  public fromSocket(player: UpdatePlayerParams) {
    this.update(player);
  }
}