import { CubeTexture, Mesh, MeshBasicMaterial } from "three";
import { Renderable } from "../utils/Renderable";
import { IViewOption, PerspectiveType, View } from "./View"

export interface ITownViewOption extends IViewOption {}

export enum TownViewEvent {
  profile
}

export class TownView extends View {
  private town: Renderable;
  private background: CubeTexture | null = null;
  constructor(option: ITownViewOption) {
    super(Object.assign(option, {
      perspectives: [PerspectiveType.FIRST, PerspectiveType.BACK, PerspectiveType.FRONT]
    }));
    const self = this;
    this.town = new Renderable().transform({ scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1 });
    this.assetManager.get('fbx/town.fbx')
    .then(res => {
      self.town.onLoad([res]);
    })
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

    this.localPlayer?.transform({ scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1 })
  }

  public mounted() {
    this.controlManager.on('keyup', this.onKeyup.bind(this));
  }

  public beforeDestoryed() {}

  public render(dt: number) {
    if (this.background !== null && this.scene !== null) {
      this.scene.background = this.background;
    }
    
    this.sceneManager.add(this.town, (child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh && mesh.name.startsWith("proxy")) {
        (mesh.material as MeshBasicMaterial).visible = false;
        return true;
      }
      return false;
    });
    
    if (this.localPlayer !== null) {
      this.sceneManager.add(this.localPlayer.object);
    }

    this.move(dt);

    this.sceneManager.render(this.camera);
  }

  private onKeyup(e: Event) {
    switch((e as KeyboardEvent).key) {
      case 'p': 
        this.emit(TownViewEvent.profile, this.localPlayer?.profileID); break;
    }
  }
}