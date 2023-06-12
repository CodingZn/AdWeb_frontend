import { Component, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { Game } from '../Game';
import {
  SocketService,
  SocketServiceObservableTokens,
} from '../socket/socket.service';
import { Subscription, tap } from 'rxjs';
import { ForwardMessageParams, UpdatePlayerParams } from '../socket/model';

// for debug
window.THREE = THREE;

// type alias for understanding
type Message = ForwardMessageParams;
type Player = UpdatePlayerParams;

@Component({
  standalone: true,
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class TestComponent {
  private game: Game;

  private subscriptions: Subscription[] = [];

  constructor(private ref: ElementRef, private socketService: SocketService) {
    const container = document.body;

    const game = new Game({ container });
    (window as any).game = game;
    this.game = game;

    /*
    handle receive message and update player here ...
    or just pass the observables into the deeper layer
    */
    this.subscriptions.push(
      this.socketService
        .getObservable<Message>(SocketServiceObservableTokens.Message)
        ?.pipe(
          tap((message) => {
            // do real handling here
          })
        )
        .subscribe()
    );

    this.subscriptions.push(
      this.socketService
        .getObservable<Player>(SocketServiceObservableTokens.Player)
        ?.pipe(
          tap((player) => {
            // do real handling here
          })
        )
        .subscribe()
    );
  }

  ngOnDestroy() {
    this.game.destory();

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
