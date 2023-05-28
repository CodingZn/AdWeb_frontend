import { Clock } from "three";
import { JoyStick } from "./lib/JoyStick";
import { PerspectiveType } from "./utils/PerspectiveManager";
import { ISceneParams, SceneManager } from "./utils/SceneManager"

interface IGameOption {
  container?: HTMLElement
}

const defaultOption: IGameOption = {
  container: document.body
}

export class Game {
  private option: IGameOption;
  private sceneManager: SceneManager;
  private joyStick: JoyStick;
  
  private clock: Clock = new Clock();
  private move: { forward: number, turn: number } = { forward: 0, turn: 0 };
  
  constructor(option: IGameOption) {
    this.option = Object.assign(defaultOption, option);
    const container = this.option.container as HTMLElement;
    this.sceneManager = new SceneManager({
      container,
      assetsPath: 'assets/'
    });
    const onMove = this.onMove.bind(this);
    this.joyStick = new JoyStick({ container, onMove });
    this.joyStick.mount();

    // todo
    this.sceneManager.switchScene('default');
    this.sceneManager.switchCamera(PerspectiveType.BACK);
    
    const town = this.sceneManager.add('town', { url: 'fbx/town.fbx' });
    const doctor = this.sceneManager.add('doctor', { 
      url: [
        'fbx/people/Doctor.fbx',
        'images/SimplePeople_Doctor_White.png'
      ]
    });

    town.transform({ scale: [0.1, 0.1, 0.1] })
    doctor.transform({ scale: [0.1, 0.1, 0.1], translateZ: -100 })
    doctor.update({ x: 312, y: 0, z: -17 });
    this.sceneManager.updateCamera({ x: 312, y: 0, z: -17 });

    (window as any).doctor = doctor;
    (window as any).town = town;

    this.render();
  }

  private onMove(forward: number, turn: number) {
    this.move = { forward, turn };
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    // 移动相机
    const { forward, turn } = this.move;
    const speed = 10;
    this.sceneManager.moveCamera({ z: -forward * speed * dt, x: turn * speed * dt });

    this.sceneManager.render();
    requestAnimationFrame( function(){ self.render(); } );
  }
}