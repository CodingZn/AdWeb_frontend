import { IPlayerState } from "../3d/characters/Player";

export interface GetPlayerRequest {
  scene: string
}

export interface IPlayerModel extends IPlayerState {
  scene: string
}

export type GetPlayerResponse = IPlayerModel[];

export type PutPlayerRequest = IPlayerModel;

export type PutPlayerResponse = IPlayerModel;