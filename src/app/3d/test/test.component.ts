import { Component, ElementRef, OnInit } from '@angular/core';
import { SceneManager } from '../utils/SceneManager';
import * as THREE from 'three';
import { PerspectiveType } from '../utils/PerspectiveManager';
import { Game } from '../Game';

// for debug
window.THREE = THREE;

@Component({
  standalone: true,
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent {
  private game: Game;
  constructor(private ref: ElementRef) {
    const container = document.body;

    const game = new Game({ container });
    (window as any).game = game; 
    this.game = game;
  }

  ngOnDestroy() {
    this.game.destory()
  }
}
