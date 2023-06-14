import {IViewOption, IViewProps, View} from "./View";
import {CubeTexture} from "three";
import {DistributionClassroom} from "../utils/DistributionClassroom";


export enum DistributionEvent {
  profile,
  learn
}


export class DistributionView extends View{
  private background: CubeTexture | null = null;
  private distClassroom: DistributionClassroom;

  constructor(option: IViewOption) {
    super(option);
    this.assetManager.get(
      [
        'px.jpg', 'nx.jpg',
        'py.jpg', 'ny.jpg',
        'pz.jpg', 'nz.jpg'
      ].map(url => `images/${url}`)
    )
      .then(res => {
        this.background = res as CubeTexture;
      });

    this.distClassroom = new DistributionClassroom({});

  }

  protected beforeDestoryed(): any {
  }

  protected mounted(props?: IViewProps): any {
    this.controlManager.on('keyup', this.onKeyup.bind(this));
    this.localPlayer!.update({ x: 100, y: 100, z: 100 });
  }

  render(dt: number): any {
    this.scene!.background = this.background;

    this.add(this.localPlayer!);

    for (const [_, player] of this.playerMap) this.add(player);

    this.add(this.distClassroom);

    this.move(dt);

    this.sceneManager.render(this.camera);
  }

  private onKeyup(e: Event) {
    switch((e as KeyboardEvent).key) {
      case 'p':
        this.emit(DistributionEvent.profile, this.localPlayer!.profileID); break;
      case 'l':
        this.emit(DistributionEvent.learn); break;
      // case 'k':
      //   this.distClassroom.cleanCubes();break;
      case 'g':
        this.controlManager._onGen((data)=>this.distClassroom.generateCubes(data));
    }
  }
}
