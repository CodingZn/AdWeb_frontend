import { io, Socket } from 'socket.io-client';
import { Injectable } from '@angular/core';
import { ClientEvent, ServerEvent } from './Event';
import { ForwardMessageParams, UpdatePlayerParams } from './model';
import { createObservableFromSocket } from 'src/app/utils/socketUtils';
import { Observable, pipe, Subscriber, Subscription, tap } from 'rxjs';
import { debugOutput, Operator } from 'src/app/utils/operator';

const socketUrl = 'http://localhost:12345';

type Message = ForwardMessageParams;
type Player = UpdatePlayerParams;

export enum SocketServiceObservableTokens {
  Message,
  Player,
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
        tap(() => this.clearSubscriptions())
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
}
