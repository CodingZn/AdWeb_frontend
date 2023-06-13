import { Clock } from "three";
import { AssetManager } from "./managers/AssetManager";
import { ControlManager } from "./managers/ControlManager";
import { PerspectiveManager } from "./managers/PerspectiveManager";
import { SceneManager } from "./managers/SceneManager"
import { ProfileView, ProfileViewEvent } from "./views/ProfileView";
import { TownView, TownViewEvent } from "./views/TownView";
import { IManagers, IViewProps, View } from "./views/View";
import { LocalPlayer } from "./characters/LocalPlayer";
import { assign } from "lodash";
import { SocketService, SocketServiceObservableTokens } from "./socket/socket.service";
import { StudyView, StudyViewEvent } from "./views/StudyView";
import { UserSessionService } from "../user-session.service";
import { Subscription, tap } from "rxjs";
import { ExitSceneParams, ForwardMessageParams, UpdatePlayerParams } from "./socket/model";
import { IPlayerUpdateParams, Player } from "./characters/Player";
import { addDisposableEventListener, Disposable } from "./utils/Disposable";
import { Chat } from "./lib/Chat";

interface IGameOption {
  container?: HTMLElement,
  socketService: SocketService,
  userSessionService: UserSessionService,
  onExit: () => any
}



const defaultOption = () => ({
  container: document.body
})

export class Game extends Disposable {
  private container: HTMLElement;
  private activeView: View | null = null;
  private managers!: IManagers;
  private localPlayer!: LocalPlayer;
  private localPlayerStateMap: Map<string, IPlayerUpdateParams> = new Map();
  private playerMap: Map<string, Player> = new Map();
  private viewMap: Map<string, View> = new Map();
  private prevView: View | null = null;
  private socketService!: SocketService;
  private userSessionService!: UserSessionService;
  private subscriptions: Subscription[] = [];
  private chat!: Chat;
  private onExit: () => any;
  
  private clock: Clock = new Clock();
  
  constructor(option: IGameOption) {
    super();
    const { container, userSessionService, socketService, onExit } = assign(defaultOption(), option);
    this.container = container;
    this.userSessionService = userSessionService;
    this.socketService = socketService;
    this.onExit = onExit;

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
    // 切换场景，清空当前玩家
    this.playerMap.forEach(player => player.destory());
    this.playerMap.clear();
    // 保存当前玩家状态
    if (this.prevView !== null) {
      this.localPlayerStateMap.set(this.prevView.name, this.localPlayer.state);
    }
    if (view !== undefined) {
      this.activeView = view.mount(props);
      const state = this.localPlayerStateMap.get(name);
      this.localPlayer.update(state || {});
    } else {
      console.warn('No such view: ', name);
    }
  }

  private render() {
    const self = this;
    const dt = this.clock.getDelta();

    if (this.activeView !== null) this.activeView.render(dt);

    this.socketService.updatePlayer(this.localPlayer.toSocket(this.activeView!.name));

    requestAnimationFrame( () => self.render() );
  }

  private initManagers() {
    const { container } = this; 
    
    const sceneManager = this._register(new SceneManager({ container }));
    const perspectiveManager = this._register(new PerspectiveManager({ container }));
    const assetManager = this._register(new AssetManager({ assetsPath: 'assets/' }));
    const controlManager = this._register(new ControlManager({ container }));

    this.managers = {
      sceneManager,
      perspectiveManager,
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
        .getObservable<never>(SocketServiceObservableTokens.Disconnect)
        ?.pipe(
          tap(() => {
            // do real handling here
            window.alert('DISCONNECT!')
            this.onExit();
          })
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.socketService
        .getObservable<ForwardMessageParams>(SocketServiceObservableTokens.Message)
        ?.pipe(
          tap((msg) => this.onReceive(msg))
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.socketService
        .getObservable<UpdatePlayerParams>(SocketServiceObservableTokens.Player)
        ?.pipe(
          tap((player) => {
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

    this.subscriptions.push(
      this.socketService
        .getObservable<ExitSceneParams>(SocketServiceObservableTokens.ExitSceneRoom)
        ?.pipe(
          tap((params) => {
            const { id } = params;
            const player = self.playerMap.get(id);
            player!.dispose();
            self.playerMap.delete(params.id);
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

    this.chat = this._register(
      new Chat((message: string, receiver?: Player) => {
        const msg = {
          message,
          sender: this.localPlayer.id,
          receiver: receiver?.id
        };
        this.socketService.sendMessage(msg);
        this.onReceive(msg);
      })
    );
    this._register(addDisposableEventListener(this.container, 'mousedown', () => {
      const player = this.localPlayer.focusedObject
      if (player instanceof Player) {
        this.chat.to = player;
        this.chat.mount(this.container);
        this.managers.controlManager.unlock();
      } else {
        this.chat.to = undefined;
      }
    }))
    this._register(addDisposableEventListener(window, 'keyup', (e) => {
      if ((e as KeyboardEvent).key === 'c') {
        if (this.chat.mounted) {
          this.chat.unmount();
        } else {
          this.chat.mount(this.container);
          this.managers.controlManager.unlock();
        }
      }
    }))
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
      self.localPlayerStateMap.forEach(state => state.profileID = profileID);
      self.switch(this.prevView!.name);
    });
    profileView.on(ProfileViewEvent.exit, () => {
      self.switch(townView.name);
    })
    this.localPlayerStateMap.set(profileView.name, {});
    this.viewMap.set(profileView.name, profileView);

    const townView = new TownView({ 
      name: 'town', 
      localPlayer,
      playerMap,
      ...this.managers 
    });
    townView.on(TownViewEvent.profile, () => {
      self.switch(profileView.name, { profileID: localPlayer.profileID });
    })
    townView.on(TownViewEvent.learn, () => {
      self.switch(studyView.name);
    })
    this.localPlayerStateMap.set(townView.name, { x: 0, y: 0, z: -1500 });
    this.viewMap.set(townView.name, townView);

    const studyView = new StudyView({ 
      name: 'study', 
      localPlayer,
      playerMap,
      ...this.managers 
    });
    studyView.on(StudyViewEvent.profile, () => {
      self.switch(profileView.name, { profileID: localPlayer.profileID });
    })
    studyView.on(StudyViewEvent.town, () => {
      self.switch(townView.name);
    })
    this.localPlayerStateMap.set(studyView.name, { x: 100, y: 100, z: 100 });
    this.viewMap.set(studyView.name, studyView);

    this.switch(studyView.name);
  }

  private getPlayer(id: string | undefined) {
    if (id === undefined) return undefined;
    let player = this.playerMap.get(id);
    if (player === undefined && id === this.localPlayer.id) {
      player = this.localPlayer;
    }
    return player
  }

  private onReceive(msg: ForwardMessageParams) {
    const { message } = msg;
    const sender = this.getPlayer(msg.sender)!;
    const receiver = this.getPlayer(msg.receiver);
    this.chat.onReceive({
      message,
      sender,
      receiver
    }, sender === this.localPlayer, receiver === this.localPlayer);
    sender.say(msg.message);
  }
}