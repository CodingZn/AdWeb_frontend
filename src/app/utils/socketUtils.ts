import { Observable } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ClientEvent } from '../3d/socket/Event';

export type SocketContext = {
  socket: Socket;
};

export const createObservableFromSocket = <T>(
  socket: Socket,
  eventName: ClientEvent
) => {
  return new Observable<T>((observer) => {
    socket.on(eventName, (data: T) => {
      observer.next(data);
    });
  }) as Observable<T>;
};
