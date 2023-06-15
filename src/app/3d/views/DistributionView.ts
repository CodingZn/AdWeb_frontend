import {IViewOption, IViewProps, View} from "./View";
import {CubeTexture} from "three";
import {DistributionClassroom} from "../utils/DistributionClassroom";
import {HttpClient, HttpParams, HttpXhrBackend} from "@angular/common/http";

const http = new HttpClient(new HttpXhrBackend({
  build: () => new XMLHttpRequest()
}));
const baseUrl = "http://124.221.101.230:8080";

export enum DistributionEvent {
  profile,
  learn
}


export class DistributionView extends View{
  private now: number = 0;
  private background: CubeTexture | null = null;
  private distClassroom: DistributionClassroom;
  private updateDist: any;

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
    clearInterval(this.updateDist);
  }

  protected mounted(props?: IViewProps): any {
    this.controlManager.on('keyup', this.onKeyup.bind(this));
    this.localPlayer!.update({ x: 100, y: 100, z: 100 });
    this.updateDist = setInterval(()=>{this.checkChange()}, 1000);
  }

  override render(dt: number): any {
    this.scene!.background = this.background;

    this.add(this.localPlayer!);

    for (const [_, player] of this.playerMap) this.add(player);

    this.add(this.distClassroom);

    super.render(dt);
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
        this.controlManager.unlock();
    }
  }

  public checkChange(){
    let params = new HttpParams().set("now", this.now);
    http.get(baseUrl+"/distribution/check", {params: params})
      .subscribe((data:any)=>{
        if (data != null){
          this.now = data.now;
          this.distClassroom.generateCubes(data.data);
        }
      },
        error => {})
  }
}
