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
    
    const bird = this.sceneManager.add('bird', { url: 'model/bird.obj', x: -10});
    const bunny = this.sceneManager.add('bunny', { url: 'model/bunny.obj', x: -5});
    const gumby = this.sceneManager.add('gumby', { url: 'model/gumby.obj', x: 0 });
    const town = this.sceneManager.add('town', { url: 'fbx/town.fbx' });
    bird.transform({ scale: [10, 10, 10] });
    bunny.transform({ scale: [10, 10, 10] });
    gumby.transform({ scale: [0.1, 0.1, 0.1] });

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