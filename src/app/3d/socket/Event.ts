export enum ServerEvent {
  Connect = 'connection',
  Disconnect = 'disconnect',

  UpdatePlayer = 'update player',
  ForwardMessage = 'forward message',
};

export enum ClientEvent {
  Connect = 'connect',
  Disconnect = 'disconnect',

  ReceiveMessage = 'receive message',
  UpdatePlayer = 'update player',
  ExitSceneRoom = "exit scene room",
};

export type Event = ServerEvent | ClientEvent;
