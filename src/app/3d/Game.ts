import { Clock } from "three";
import { ControlManager, IMoveState } from "./managers/ControlManager";
import { ObjectManager } from "./managers/ObjectManager";
import { PerspectiveManager } from "./managers/PerspectiveManager";
import { SceneManager } from "./managers/SceneManager"
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
  
  private clock: Clock = new Clock();
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;

    // init managers
    const sceneManager = new SceneManager({ container });
    const perspectiveManager = new PerspectiveManager({ container });
    const objectManager = new ObjectManager({ assetsPath: 'assets/' });
    const controlManager = new ControlManager({ container });

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

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    if (this.activeView) this.activeView.render(dt);
    
    requestAnimationFrame( () => self.render() );
  }
}