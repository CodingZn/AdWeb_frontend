import { assign, keys, random } from "lodash";
import { AssetManager } from "../managers/AssetManager";
import { Player } from "../characters/Player";
import { Actions, IActions, IViewOption, IViewProps, PerspectiveType, View } from "./View"
import { CHARACTER_HEIGHT, ProfileMap } from "../characters/Character";

export interface IProfileViewOption extends IViewOption {
  assetManager: AssetManager
}

const DELTA = 500;

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
          y: CHARACTER_HEIGHT * 0.6,
          z: 500,
          targetY: CHARACTER_HEIGHT * 0.6
        }
      }],
      localPlayer: null
    }));
    ProfileMap.forEach((v, k) => {
      const profile = new Player({
        id: k + '',
        name: `model_${v}`,
        profileID: k,
        x: k * DELTA,
        showName: false,
      }, this.assetManager);
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

  public override render(dt: number) {
    const {
      sceneManager, 
      profiles, 
      camera, 
    } = this
    const self = this;
    profiles.forEach(profile => {
      self.add(profile);
      if (profile.actionDuration > 2000) {
        if (profile.action === Actions.IDLE) {
          const actions = keys(Actions);
          profile.update({ action: Actions[actions[random(actions.length - 1)] as keyof IActions] });
        } else {
          profile.update({ action: Actions.IDLE });
        }
      }
      profile.animate(dt);
      profile.transform({ rotateY: dt })
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