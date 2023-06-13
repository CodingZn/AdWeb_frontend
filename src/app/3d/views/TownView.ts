
import { assign, random } from "lodash";
import { CubeTexture } from "three";
import { ProfileMap } from "../characters/Character";
import { NPC } from "../characters/NPC";
import { Renderable } from "../utils/Renderable";
import { Town } from "../utils/Town";
import { IViewOption, PerspectiveType, View } from "./View"

export interface ITownViewOption extends IViewOption {}

export enum TownViewEvent {
  profile,
  learn
}

export class TownView extends View {
  private town: Renderable;
  private background: CubeTexture | null = null;
  private npcs: NPC[] = [];
  constructor(option: ITownViewOption) {
    super(assign(option, {
      perspectives: [PerspectiveType.FIRST, PerspectiveType.BACK, PerspectiveType.FRONT]
    }));
    const self = this;
    this.town = new Town({ name: 'town' }, this.assetManager);
    
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

    // 人物
    for (let i = 0; i < 50; i++) {
      const npc = new NPC({
        name: `NPC_${i}`,
        profileID: i % ProfileMap.length,
        x: random(-10000, 10000),
        z: random(-10000, 10000),
        isCollider: true
      }, this.assetManager)
      .transform({ rotateY: random(-Math.PI, Math.PI, true) });
      this.npcs.push(npc);
    }
  }

  public mounted() {
    this.localPlayer!.update({ x: 0, y: 0, z: -1500 });
    this.controlManager.on('keyup', this.onKeyup.bind(this));
  }

  public beforeDestoryed() {}

  public render(dt: number) {
    if (this.background !== null && this.scene !== null) {
      this.scene.background = this.background;
    }
    
    this.add(this.town);
    
    this.add(this.localPlayer!);

    for (const npc of this.npcs) this.add(npc);

    for (const [_, player] of this.playerMap) this.add(player);

    this.move(dt);

    this.sceneManager.render(this.camera);
  }

  private onKeyup(e: Event) {
    switch((e as KeyboardEvent).key) {
      case 'p': 
        this.emit(TownViewEvent.profile, this.localPlayer?.profileID); break;
      case 'l': 
        this.emit(TownViewEvent.learn); break;
    }
  }
}