import { Component, ElementRef, OnInit } from '@angular/core';
import { SceneManager } from '../utils/SceneManager';
import * as THREE from 'three';
import { PerspectiveType } from '../utils/PerspectiveManager';
window.THREE = THREE;

@Component({
  standalone: true,
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  private sceneManager: SceneManager | null = null;

  constructor(private ref: ElementRef) {}

  ngOnInit(): void {
    const container = (this.ref.nativeElement as HTMLElement).querySelector('.container') as HTMLElement;
    this.sceneManager = new SceneManager({
      container,
      assetsPath: 'assets/',
    });
    this.sceneManager.switchScene('default', { axes: true });
    this.sceneManager.switchCamera(PerspectiveType.BACK);
    const bird = this.sceneManager.add('bird', { url: 'model/bird.obj', x: -10});
    const bunny = this.sceneManager.add('bunny', { url: 'model/bunny.obj', x: -5});
    const gumby = this.sceneManager.add('gumby', { url: 'model/gumby.obj', x: 0 });
    const town = this.sceneManager.add('town', { url: 'fbx/town.fbx' });
    bird.transform({ scale: [10, 10, 10] });
    bunny.transform({ scale: [10, 10, 10] });
    gumby.transform({ scale: [0.1, 0.1, 0.1] });
    this.sceneManager.render();
    // for debug
    (window as any).sceneManager = this.sceneManager;
  }
}
