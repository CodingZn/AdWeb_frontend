import { Clock } from "three";
import { LocalPlayer } from "./LocalPlayer";
import { AssetManager } from "./managers/AssetManager";
import { ControlManager, IMoveState } from "./managers/ControlManager";
import { ObjectManager } from "./managers/ObjectManager";
import { PerspectiveManager } from "./managers/PerspectiveManager";
import { SceneManager } from "./managers/SceneManager"
import { Player } from "./Player";
import { ProfileView, ProfileViewEvent } from "./views/ProfileView";
import { TownView, TownViewEvent } from "./views/TownView";
import { IManagers, IViewProps, View } from "./views/View";

interface IGameOption {
  container?: HTMLElement
}



const defaultOption: () => IGameOption = () => ({
  container: document.body
})

export class Game {
  private option: IGameOption;
  private activeView: View | null = null;
  private managers: IManagers;
  private playerMap: Map<string, Player> = new Map();
  private localPlayer: LocalPlayer;
  private viewMap: Map<string, View> = new Map();
  
  private clock: Clock = new Clock();
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption(), option);
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

    // init player
    const localPlayer = new LocalPlayer(
      { 
        name: 'steve', 
        profileID: 0,
        x: 0,
        y: 0,
        z: -150,
      }, 
      assetManager);
    this.localPlayer = localPlayer;

    // init views
    const profileView = new ProfileView({ 
      name: 'profile',
      ...this.managers
    });
    profileView.on(ProfileViewEvent.save, (profileID: number) => {
      localPlayer.update({ profileID });
      self.switch(townView.name);
    });
    profileView.on(ProfileViewEvent.exit, () => {
      self.switch(townView.name);
    })
    this.viewMap.set(profileView.name, profileView);

    const townView = new TownView({ 
      name: 'town', 
      localPlayer,
      ...this.managers 
    });
    townView.on(TownViewEvent.profile, (profileID: number) => {
      self.switch(profileView.name, { profileID });
    })
    this.viewMap.set(townView.name, townView);

    const self = this;
    
    this.switch(townView.name);

    this.render();
  }

  public destory() {
    this.managers.sceneManager.destory();
  }

  public switch(name: string, props?: IViewProps) {
    if (this.activeView !== null) {
      this.activeView.unmount();
      this.activeView = null;
    }
    const view = this.viewMap.get(name);
    if (view !== undefined) {
      this.activeView = view.mount(props);
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