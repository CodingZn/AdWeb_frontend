import { Camera, Clock } from "three";
import { ControlManager, IMoveState } from "./utils/ControlManager";
import { ObjectManager } from "./utils/ObjectManager";
import { PerspectiveManager, PerspectiveType } from "./utils/PerspectiveManager";
import { SceneManager } from "./utils/SceneManager"
import { ProfileView } from "./views/ProfileView";
import { View } from "./views/View";

interface IGameOption {
  container?: HTMLElement
}

const defaultOption: IGameOption = {
  container: document.body
}

export class Game {
  private option: IGameOption;
  private activeView: View | null = null;
  private sceneManager: SceneManager;
  
  private clock: Clock = new Clock();
  private moveState: IMoveState = { forward: 0, right: 0, up: 0 };
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;

    // init managers
    const sceneManager = new SceneManager({ container });
    const perspectiveManager = new PerspectiveManager({ container });
    const objectManager = new ObjectManager({ assetsPath: 'assets/' });
    const controlManager = new ControlManager({ container });
    this.sceneManager = sceneManager;
    // todo
    const profileView = new ProfileView({
      sceneManager,
      perspectiveManager,
      objectManager,
      controlManager
    }).mount();

    profileView.on('save', (profileID: number) => {
      alert('save: ' + profileID)
    })

    profileView.on('exit', () => {
      alert('exit')
    })

    this.activeView = profileView;

    this.render();
  }

  public destory() {
    this.sceneManager.destory();
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    if (this.activeView) this.activeView.render(dt);
    
    requestAnimationFrame( () => self.render() );
  }
}