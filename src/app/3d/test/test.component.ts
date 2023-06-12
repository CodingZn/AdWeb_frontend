import { Component } from '@angular/core';
import * as THREE from 'three';
import { Game } from '../Game';
import {
  SocketService,
} from '../socket/socket.service';
import { UserSessionService } from 'src/app/user-session.service';

// for debug
window.THREE = THREE;

@Component({
  standalone: true,
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class TestComponent {
  private game: Game;

  constructor(userSessionService: UserSessionService, socketService: SocketService) {
    const container = document.body;

    const game = new Game({ container, socketService, userSessionService });
    (window as any).game = game;
    this.game = game;
  }

  ngOnDestroy() {
    this.game.dispose();
  }
}
