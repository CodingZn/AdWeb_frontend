import { random } from "lodash";
import { CubeTexture } from "three";
import { ProfileMap } from "../characters/Character";
import { NPC } from "../characters/NPC";
import { TeachingBuilding, TEACHING_BUILDING_DEPTH, TEACHING_BUILDING_FLOOR_HEIGHT, TEACHING_BUILDING_FLOOR_WIDTH } from "../utils/TeachingBuilding";
import { IViewOption, IViewProps, View } from "./View";

export interface ILearnViewOption extends IViewOption {

}

export enum StudyViewEvent {
  profile,
  town,
  distribution
}

export class StudyView extends View {
  private background: CubeTexture | null = null;
  private npcs: NPC[] = [];
  private teachingBuilding: TeachingBuilding;

  constructor(option: ILearnViewOption) {
    super(option);
    const self = this;
    this.assetManager.get(
      [
        'px.jpg', 'nx.jpg',
        'py.jpg', 'ny.jpg',
        'pz.jpg', 'nz.jpg'
      ].map(url => `images/${url}`)
    )
    .then(res => {
      self.background = res as CubeTexture;
    });
    // 教学楼
    this.teachingBuilding = new TeachingBuilding({
      floors: 2,
      isCollider: true
    });
    // debug
    (window as any).teachingBuilding = this.teachingBuilding;
    // 人物
    for (let i = 0; i < 20; i++) {
      const npc = new NPC({
        name: `NPC_${i}`,
        profileID: i % ProfileMap.length,
        x: random(0, TEACHING_BUILDING_FLOOR_WIDTH),
        z: random(0, TEACHING_BUILDING_DEPTH),
        y: random(0, TEACHING_BUILDING_FLOOR_HEIGHT),
        isCollider: true
      }, this.assetManager)
      .transform({ rotateY: random(-Math.PI, Math.PI, true) });
      this.npcs.push(npc);
    };
  }

  protected mounted(props?: IViewProps) {
    this.controlManager.on('keyup', this.onKeyup.bind(this));
  }

  protected beforeDestoryed() {}

  public override render(dt: number) {
    this.scene!.background = this.background;

    this.add(this.localPlayer!);

    for (const npc of this.npcs) this.add(npc);

    for (const [_, player] of this.playerMap) this.add(player);

    this.add(this.teachingBuilding);

    super.render(dt);
  }

  private onKeyup(e: Event) {
    switch((e as KeyboardEvent).key) {
      case 'p':
        this.emit(StudyViewEvent.profile, this.localPlayer!.profileID); break;
      case 't':
        this.emit(StudyViewEvent.town); break;
      case 'i':
        this.emit(StudyViewEvent.distribution); break;
    }
  }
}
