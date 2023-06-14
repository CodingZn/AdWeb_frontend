import { io, Socket } from 'socket.io-client';
import { Injectable } from '@angular/core';
import { ClientEvent, ServerEvent } from './Event';
import { ExitSceneParams, ForwardMessageParams, UpdatePlayerParams } from './model';
import { createObservableFromSocket } from 'src/app/utils/socketUtils';
import { Observable, pipe, Subscriber, Subscription, tap } from 'rxjs';
import { debugOutput, Operator } from 'src/app/utils/operator';

const socketUrl = 'http://75.101.180.138:3000';

type Message = ForwardMessageParams;
type Player = UpdatePlayerParams;

export enum SocketServiceObservableTokens {
  Message,
  Player,
  ExitSceneRoom,
  Disconnect,
}

@Injectable()
export class SocketService {
  socket: Socket;

  private subscriptions: Subscription[] = [];
  private observables = new Map<SocketServiceObservableTokens, Observable<unknown>>();
  private subscribers = new Map<SocketServiceObservableTokens, Subscriber<unknown>>();

  constructor() {
    // init socket
    this.socket = io(socketUrl);

    // init observables
    this.observables.set(
      SocketServiceObservableTokens.Message,
      new Observable((subscriber) => {
        this.subscribers.set(SocketServiceObservableTokens.Message, subscriber);
      })
    );

    this.observables.set(
      SocketServiceObservableTokens.Player,
      new Observable((subscriber) => {
        this.subscribers.set(SocketServiceObservableTokens.Player, subscriber);
      })
    );

    this.observables.set(
      SocketServiceObservableTokens.ExitSceneRoom,
      new Observable((subscriber) => {
        this.subscribers.set(SocketServiceObservableTokens.ExitSceneRoom, subscriber);
      })
    );

    this.observables.set(
      SocketServiceObservableTokens.Disconnect,
      new Observable((subscriber) => {
        this.subscribers.set(SocketServiceObservableTokens.Disconnect, subscriber);
      })
    );

    // connect event
    this.makeSubscription(
      ClientEvent.Connect,
      debugOutput('connect', () => `socket connected`)
    );

    // disconnect event
    this.makeSubscription(
      ClientEvent.Disconnect,
      pipe(
        debugOutput('disconnect', () => `socket disconnected`),
        tap(() => {
          this.subscribers.get(SocketServiceObservableTokens.Disconnect)?.next();
          this.clearSubscriptions()
        })
      )
    );

    // receive message event
    this.makeSubscription<Message>(
      ClientEvent.ReceiveMessage,
      pipe(
        debugOutput(
          'receive message',
          (message) => `${message.sender} say: ${message.message}`
        ),

        // push the message
        tap((message) => {
          this.subscribers.get(SocketServiceObservableTokens.Message)?.next(message);
        })
      )
    );

    // update player event
    this.makeSubscription<Player>(
      ClientEvent.UpdatePlayer,
      pipe(
        debugOutput(
          'update player',
          (player) => `${player.id} udpate its data`
        ),

        // push the player
        tap((player) => {
          this.subscribers.get(SocketServiceObservableTokens.Player)?.next(player);
        })
      )
    );

    // exit scene event
    this.makeSubscription<ExitSceneParams>(
      ClientEvent.ExitSceneRoom,
      pipe(
        debugOutput(
          'exit scene',
          ({ id }) => `Player ${id} leave`
        ),

        tap((params) => {
          this.subscribers.get(SocketServiceObservableTokens.ExitSceneRoom)?.next(params);
        })
      )
    );
  }

  makeSubscription<T>(ev: ClientEvent, operator: Operator<T>) {
    this.subscriptions.push(
      createObservableFromSocket<T>(this.socket, ev).pipe(operator).subscribe()
    );
  }

  getObservable<T>(token: SocketServiceObservableTokens) {
    return this.observables?.get(token) as Observable<T>
  }

  clearSubscriptions() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }

  sendMessage(message: Message) {
    this.socket.emit(ServerEvent.ForwardMessage, message);
  }

  updatePlayer(player: Player) {
    this.socket.emit(ServerEvent.UpdatePlayer, player);
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  get connected() { return this.socket.connected; }
}
