import { CubeTexture } from "three";
import { IViewOption, IViewProps, View } from "./View";

export interface ITeachingBuildingViewOption extends IViewOption {

}

export class TeachingBuildingView extends View {
  private background: CubeTexture | null = null;
  constructor(option: ITeachingBuildingViewOption) {
    super(option);
    const self = this;
    this.assetManager.get(
      [
        'px.jpg', 'nx.jpg',
        'py.jpg', 'ny.jpg',
        'pz.jpg', 'nz.jpg'
      ].map(url => `images/${url}`)
    )
    .then(res => {
      self.background = res as CubeTexture;
    });
  }

  protected mounted(props?: IViewProps | undefined) {
    
  }

  protected beforeDestoryed() {
    
  }

  public render(dt: number) {
    this.scene!.background = this.background;
  }
}