import { CubeTexture } from "three";
import { PerspectiveType } from "../managers/PerspectiveManager";
import { Renderable } from "../utils/Renderable";
import { IViewOption, View } from "./View"

export interface ITownViewOption extends IViewOption {}

export class TownView extends View {
  private town: Renderable;
  private background: CubeTexture | null = null;
  constructor(option: ITownViewOption) {
    super(option);
    const self = this;
    this.town = this.objectManager.get('town', {
      url: 'fbx/town.fbx'
   })
    .transform({ scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1 });
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

  public mount() {
    this.scene = this.sceneManager.switch('town');
    this.camera = this.perspectiveManager.switch(PerspectiveType.BACK);
    this.controlManager
      .mount(this.camera, this.onMove.bind(this));
    this.sceneManager.add(this.town);
    return this;
  }

  public unmount() {
    this.controlManager.unmount();
  }

  public render(dt: number) {
    if (this.background !== null && this.scene !== null) {
      this.scene.background = this.background;
    }
    
    // move
    const { forward, right, up } = this.moveState;
    const speed = 10;
    this.perspectiveManager.move({ 
      z: - forward * speed * dt, 
      x: right * speed * dt 
    });

    this.sceneManager.render(this.camera);
  }
}