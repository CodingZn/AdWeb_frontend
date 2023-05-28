import { Camera, Clock } from "three";
import { ControlManager, IMoveState } from "./utils/ControlManager";
import { ObjectManager } from "./utils/ObjectManager";
import { PerspectiveManager, PerspectiveType } from "./utils/PerspectiveManager";
import { SceneManager } from "./utils/SceneManager"

interface IGameOption {
  container?: HTMLElement
}

const defaultOption: IGameOption = {
  container: document.body
}

export class Game {
  private option: IGameOption;
  private sceneManager: SceneManager;
  private objectiveManager: ObjectManager;
  private perspectiveManager: PerspectiveManager;
  private controlManager: ControlManager;
  
  private clock: Clock = new Clock();
  private moveState: IMoveState = { forward: 0, right: 0, up: 0 };
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;

    // init managers
    this.sceneManager = new SceneManager({ container });
    this.perspectiveManager = new PerspectiveManager({ container });
    this.objectiveManager = new ObjectManager({ assetsPath: 'assets/' });

    const onMove = this.onMove.bind(this);
    this.controlManager = new ControlManager({ container, onMove });

    // todo
    this.sceneManager.switch('default');
    this.perspectiveManager.switch(PerspectiveType.BACK);
    this.controlManager.on(this.perspectiveManager.camera);
    
    // init objects
    const town = this.objectiveManager.get('town', { url: 'fbx/town.fbx' });
    const doctor = this.objectiveManager.get('doctor', { 
      url: [
        'fbx/people/Doctor.fbx',
        'images/SimplePeople_Doctor_White.png'
      ]
    });
    town.transform({ scale: [0.1, 0.1, 0.1] });
    doctor.transform({ scale: [0.1, 0.1, 0.1] })
          .update({ x: 350, y: 0, z: -50 });

    // add object to scene
    this.sceneManager.add(town);
    this.sceneManager.add(doctor);
    // set camera
    this.perspectiveManager.update({ x: 400, y: 0, z: -50 });
    
    // for debug
    (window as any).doctor = doctor;
    (window as any).town = town;

    this.render();
  }

  private onMove(state: IMoveState) {
    this.moveState = state;
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    // 移动相机
    const { forward, right } = this.moveState;
    const speed = 10;
    this.perspectiveManager.move({ z: -forward * speed * dt, x: right * speed * dt });

    this.sceneManager.render(this.perspectiveManager.camera);
    requestAnimationFrame( () => self.render() );
  }
}