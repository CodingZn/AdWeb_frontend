import { Clock } from "three";
import { AssetManager } from "./managers/AssetManager";
import { ControlManager, IMoveState } from "./managers/ControlManager";
import { ObjectManager } from "./managers/ObjectManager";
import { PerspectiveManager } from "./managers/PerspectiveManager";
import { SceneManager } from "./managers/SceneManager"
import { ProfileView } from "./views/ProfileView";
import { TownView } from "./views/TownView";
import { IManagers, View } from "./views/View";

interface IGameOption {
  container?: HTMLElement
}



const defaultOption: IGameOption = {
  container: document.body
}

export class Game {
  private option: IGameOption;
  private activeView: View | null = null;
  private managers: IManagers;
  private viewMap: Map<string, View> = new Map();
  
  private clock: Clock = new Clock();
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;

    // init managers
    const sceneManager = new SceneManager({ container });
    const perspectiveManager = new PerspectiveManager({ container });
    const assetManager = new AssetManager({ assetsPath: 'assets/' });
    const objectManager = new ObjectManager({ assetManager });
    const controlManager = new ControlManager({ container });

    this.managers = {
      sceneManager,
      perspectiveManager,
      objectManager,
      assetManager,
      controlManager
    }
    // todo
    const profileView = new ProfileView(this.managers);

    this.viewMap.set('profile', profileView);

    const townView = new TownView(this.managers);
    
    this.viewMap.set('town', townView);

    const self = this;
    this.switch('profile');
    profileView.on('save', (profileID: number) => {
      console.log('save: ' + profileID)
      self.switch('town');
    })

    profileView.on('exit', () => {
      self.switch('town');
    })

    this.render();
  }

  public destory() {
    this.managers.sceneManager.destory();
  }

  public switch(name: string) {
    if (this.activeView !== null) {
      this.activeView.unmount();
      this.activeView = null;
    }
    const view = this.viewMap.get(name);
    if (view !== undefined) {
      this.activeView = view.mount();
    } else {
      console.warn('No such view: ', name);
    }
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    if (this.activeView !== null) this.activeView.render(dt);
    
    requestAnimationFrame( () => self.render() );
  }
}