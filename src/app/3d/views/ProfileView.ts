import { Player, ProfileMap } from "../Player";
import { PerspectiveType } from "../managers/PerspectiveManager"
import { IViewOption, View } from "./View"
import { Cylinder } from "../utils/Box";

export interface IProfileViewOption extends IViewOption {}

const DELTA = 50;

export class ProfileView extends View {
  private profiles: Player[] = [];
  private leftArrow: Cylinder;
  private rightArrow: Cylinder;
  private _profileID = 0;

  constructor(options: IProfileViewOption) {
    super(options);
    ProfileMap.forEach((v, k) => {
      const profile = new Player({
        name: `model_${v}`,
        profileID: k,
        x: k * DELTA,
      }, this.objectManager);
      profile.object.transform({ scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1  })
      this.profiles.push(profile);
    });
    this.leftArrow = new Cylinder({ name: 'leftArrow', radiusBottom: 5, height: 5 });
    this.rightArrow = new Cylinder({ name: 'rightArrow', radiusBottom: 5, height: 5 });
  }

  public mount() {
    this.scene = this.sceneManager.switch('profile', {
      background: 0x0088ff,
    });
    this.camera = this.perspectiveManager.switch(PerspectiveType.FIXED, {
      x: 0,
      y: 10,
      z: 50,
      targetY: 15
    });
    this.controlManager
      .update({ showJoyStick: false, controlPointer: false })
      .mount(this.camera, this.onMove.bind(this))
      .on('keyup', this.onKeyUp.bind(this));

    return this;
  }

  public unmount() {
    this.controlManager.unmount();
  }

  public render(dt: number) {
    const {
      sceneManager, 
      profiles, 
      camera, 
    } = this
    
    profiles.forEach(profile => {
      sceneManager.add(profile.object);
      profile.object.transform({ rotateY: dt * 1 })
    });

    sceneManager.add(this.leftArrow);
    sceneManager.add(this.rightArrow);
    
    sceneManager.render(camera);
  }

  private onKeyUp(e: Event) {
    e.preventDefault();
    switch((e as KeyboardEvent).key) {
      case 'a': 
      case 'ArrowLeft': 
        this.profileID --; break;
      case 'd':
      case 'ArrowRight':
        this.profileID ++; break;
      case 'Enter': 
      case ' ':
        this.emit('save', this.profileID); break;
      case 'Escape': 
        this.emit('exit'); break;
    }
  }

  private get profileID() {
    return this._profileID;
  }

  private set profileID(v: number) {
    let val = v;
    if (v >= this.profiles.length) {
      val = 0;
    } else if (v < 0) {
      val = this.profiles.length - 1;
    }
    this.perspectiveManager.move({ x: (val - this.profileID) * DELTA });
    this._profileID = val;
    
  }
}