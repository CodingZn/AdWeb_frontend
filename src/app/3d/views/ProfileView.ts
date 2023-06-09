import { assign, keys, random } from "lodash";
import { AssetManager } from "../managers/AssetManager";
import { Player, ProfileMap } from "../Player";
import { Actions, IActions, IViewOption, IViewProps, PerspectiveType, View } from "./View"

export interface IProfileViewOption extends IViewOption {
  assetManager: AssetManager
}

const DELTA = 50;

export interface IProfileViewProps extends IViewProps {
  profileID: number
}

export enum ProfileViewEvent {
  save, exit
}

export class ProfileView extends View {
  private profiles: Player[] = [];
  private _profileID = 0;

  constructor(options: IProfileViewOption) {
    super(assign(options, { 
      perspectives: [{
        type: PerspectiveType.FIXED,
        params: {
          x: 0,
          y: 10,
          z: 50,
          targetY: 15
        }
      }],
      localPlayer: null
    }));
    ProfileMap.forEach((v, k) => {
      const profile = new Player({
        name: `model_${v}`,
        profileID: k,
        x: k * DELTA,
      }, this.assetManager);
      profile.object.transform({ scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1  })
      this.profiles.push(profile);
    });
  }

  public mounted(props?: IProfileViewProps) {
    this.sceneManager.update({ background: 0x0088ff, sun: null });
    this.controlManager.on('keyup', this.onKeyUp.bind(this));
    if (props !== undefined) {
      this.profileID = props.profileID;
    }
  }

  public beforeDestoryed() {
    // 相机归位
    this.profileID = 0;
  }

  public render(dt: number) {
    const {
      sceneManager, 
      profiles, 
      camera, 
    } = this
    
    profiles.forEach(profile => {
      sceneManager.add(profile.object);
      if (profile.actionDuration > 2000) {
        if (profile.action === Actions.IDLE) {
          const actions = keys(Actions);
          profile.update({ action: Actions[actions[random(actions.length - 1)] as keyof IActions] });
        } else {
          profile.update({ action: Actions.IDLE });
        }
      }
      profile.act(dt);
      profile.object.transform({ rotateY: dt })
    });
    
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
        this.emit(ProfileViewEvent.save, this.profileID); break;
      case 'Escape': 
        this.emit(ProfileViewEvent.exit); break;
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