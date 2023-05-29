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
  
  private clock: Clock = new Clock();
  private moveState: IMoveState = { forward: 0, right: 0, up: 0 };
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;

    // init managers
    const sceneManager = new SceneManager({ container });
    const perspectiveManager = new PerspectiveManager({ container });
    const objectManager = new ObjectManager({ assetsPath: 'assets/' });

    const onMove = this.onMove.bind(this);
    const controlManager = new ControlManager({ container, onMove });

    // todo
    // this.sceneManager.switch('default');
    // this.perspectiveManager.switch(PerspectiveType.BACK);
    // this.controlManager.on(this.perspectiveManager.camera);
    
    // init objects
    // const town = this.objectManager.get('town', { url: 'fbx/town.fbx' });
    // const doctor = this.objectManager.get('doctor', { 
    //   url: [
    //     'fbx/people/Doctor.fbx',
    //     'images/SimplePeople_Doctor_White.png'
    //   ]
    // });
    // town.transform({ scale: [0.1, 0.1, 0.1] });
    // doctor.transform({ scale: [0.1, 0.1, 0.1] })
    //       .update({ x: 350, y: 0, z: -50 });

    // // add object to scene
    // this.sceneManager.add(town);
    // this.sceneManager.add(doctor);
    // // set camera
    // this.perspectiveManager.update({ x: 400, y: 0, z: -50 });
    
    // for debug
    // (window as any).doctor = doctor;
    // (window as any).town = town;

    const profileView = new ProfileView({
      sceneManager,
      perspectiveManager,
      objectManager,
      controlManager
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

  private onMove(state: IMoveState) {
    if (this.activeView) {
      this.activeView.onMove(state);
    }
  }
}