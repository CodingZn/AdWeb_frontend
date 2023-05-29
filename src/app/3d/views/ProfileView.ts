import { Player, ProfileMap } from "../Player";
import { IMoveState } from "../utils/ControlManager";
import { PerspectiveType } from "../utils/PerspectiveManager";
import { IViewOption, View } from "./View"

export interface IProfileViewOption extends IViewOption {}

export class ProfileView extends View {
  private profiles: Player[] = [];
  constructor(options: IProfileViewOption) {
    super(options);
    ProfileMap.forEach((v, k) => {
      const profile = new Player({
        name: `model_${v}`,
        profileID: k,
        x: k * 100,
      }, this.objectManager);
      profile.object.transform({ scale: [0.1, 0.1, 0.1] })
      this.profiles.push(profile)
    });
  }
  
  public get camera() {
    return this.perspectiveManager.camera;
  }

  public override render(dt: number) {
    const { sceneManager, perspectiveManager, controlManager, profiles } = this
    sceneManager.switch('profile', {
      background: 0x0088ff
    });
    profiles.forEach(profile => {
      sceneManager.add(profile.object)
    });
    perspectiveManager.switch(PerspectiveType.FIXED, {
      x: 0,
      y: 0,
      z: 100,
    });
    // 移动相机
    const { forward, right } = this.moveState;
    const speed = 10;
    perspectiveManager.move({ z: -forward * speed * dt, x: right * speed * dt });
    controlManager.on(perspectiveManager.camera);
    sceneManager.render(this.perspectiveManager.camera);
  }
}