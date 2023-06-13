import { AssetManager } from "../managers/AssetManager";
import { IRenderableParams, Renderable } from "./Renderable";

export interface ISpeechBubbleParams extends IRenderableParams {

}

export class SpeechBubble extends Renderable {
  private assetManager: AssetManager;
  
  constructor(params: ISpeechBubbleParams, assetManager: AssetManager) {
    super(params);
    this.assetManager = assetManager;
  }

  
}