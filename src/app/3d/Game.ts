import { Clock } from "three";
import { AssetManager } from "./managers/AssetManager";
import { ControlManager } from "./managers/ControlManager";
import { ObjectManager } from "./managers/ObjectManager";
import { PerspectiveManager } from "./managers/PerspectiveManager";
import { SceneManager } from "./managers/SceneManager"
import { ProfileView, ProfileViewEvent } from "./views/ProfileView";
import { TownView, TownViewEvent } from "./views/TownView";
import { IManagers, IViewProps, View } from "./views/View";
import { LocalPlayer } from "./characters/LocalPlayer";
import { assign, values } from "lodash";
import { SocketService, SocketServiceObservableTokens } from "./socket/socket.service";
import { StudyView, StudyViewEvent } from "./views/StudyView";
import { UserSessionService } from "../user-session.service";
import { Subscription, tap } from "rxjs";
import { ForwardMessageParams, UpdatePlayerParams } from "./socket/model";
import { Player } from "./characters/Player";
import { Disposable } from "./utils/Disposable";

interface IGameOption {
  container?: HTMLElement,
  socketService: SocketService,
  userSessionService: UserSessionService,
}



const defaultOption = () => ({
  container: document.body
})

export class Game extends Disposable {
  private container: HTMLElement;
  private activeView: View | null = null;
  private managers!: IManagers;
  private localPlayer!: LocalPlayer;
  private playerMap: Map<string, Player> = new Map();
  private viewMap: Map<string, View> = new Map();
  private prevView: View | null = null;
  private socketService!: SocketService;
  private userSessionService!: UserSessionService;
  private subscriptions: Subscription[] = [];
  
  private clock: Clock = new Clock();
  
  constructor(option: IGameOption) {
    super();
    const { container, userSessionService, socketService } = assign(defaultOption(), option);
    this.container = container;
    this.userSessionService = userSessionService;
    this.socketService = socketService;

    this.initManagers();

    this.initSockect();

    this.initPlayer();

    this.initViews();

    this.render();
  }

  public switch(name: string, props?: IViewProps) {
    if (this.activeView !== null) {
      this.activeView.unmount();
      this.prevView = this.activeView;
      this.activeView = null;
    }
    const view = this.viewMap.get(name);
    if (view !== undefined) {
      this.activeView = view.mount(props);
    } else {
      console.warn('No such view: ', name);
    }
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    if (this.activeView !== null) this.activeView.render(dt);

    this.socketService.updatePlayer(this.localPlayer.toSocket());

    requestAnimationFrame( () => self.render() );
  }

  private initManagers() {
    const { container } = this; 
    
    const sceneManager = this._register(new SceneManager({ container }));
    const perspectiveManager = this._register(new PerspectiveManager({ container }));
    const assetManager = this._register(new AssetManager({ assetsPath: 'assets/' }));
    const objectManager = this._register(new ObjectManager({ assetManager }));
    const controlManager = this._register(new ControlManager({ container }));

    this.managers = {
      sceneManager,
      perspectiveManager,
      objectManager,
      assetManager,
      controlManager
    }
  }

  private initSockect() {
    const self = this;
    this.socketService.connect();
    /*
    handle receive message and update player here ...
    or just pass the observables into the deeper layer
    */
    this.subscriptions.push(
      this.socketService
        .getObservable<ForwardMessageParams>(SocketServiceObservableTokens.Message)
        ?.pipe(
          tap((message) => {
            // do real handling here
            console.log('msg', message)
          })
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.socketService
        .getObservable<UpdatePlayerParams>(SocketServiceObservableTokens.Player)
        ?.pipe(
          tap((player) => {
            // do real handling here
            console.log('update', player);
            const { id } = player;
            const oldPlayer = self.playerMap.get(id);
            if (oldPlayer !== undefined) {
              oldPlayer.fromSocket(player);
            } else {
              const newPlayer = new Player(assign(player, { isCollider: true }), self.managers.assetManager);
              self.playerMap.set(id, newPlayer);
            }
          })
        )
        .subscribe()
    );

    this._register({
      dispose: () => {
        self.socketService.disconnect();
        self.subscriptions.forEach((subscription) => subscription.unsubscribe());
      }
    })
  }

  private initPlayer() {
    const { id, username, exp } = this.userSessionService.getTokenInfo()!;
    this.localPlayer = new LocalPlayer(
      { 
        id: id + '',
        name: username,
        profileID: 0,
        isCollider: true
      }, 
      this.managers.assetManager);
  }

  private initViews() {
    const profileView = new ProfileView({ 
      name: 'profile',
      ...this.managers
    });
    const { localPlayer, playerMap } = this;
    const self = this;
    profileView.on(ProfileViewEvent.save, (profileID: number) => {
      localPlayer.update({ profileID });
      self.switch(this.prevView!.name);
    });
    profileView.on(ProfileViewEvent.exit, () => {
      self.switch(townView.name);
    })
    this.viewMap.set(profileView.name, profileView);

    const townView = new TownView({ 
      name: 'town', 
      localPlayer,
      playerMap,
      ...this.managers 
    });
    townView.on(TownViewEvent.profile, (profileID: number) => {
      self.switch(profileView.name, { profileID });
    })
    townView.on(TownViewEvent.learn, () => {
      self.switch(studyView.name);
    })
    this.viewMap.set(townView.name, townView);

    const studyView = new StudyView({ 
      name: 'study', 
      localPlayer,
      playerMap,
      ...this.managers 
    });
    studyView.on(StudyViewEvent.profile, () => {
      self.switch(profileView.name);
    })
    studyView.on(StudyViewEvent.town, () => {
      self.switch(townView.name);
    })
    this.viewMap.set(studyView.name, studyView);

    this.switch(studyView.name);
  }
}