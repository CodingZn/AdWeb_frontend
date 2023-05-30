import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {UserSessionService} from "../user-session.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(private router: Router,
              private userSessionService: UserSessionService) {
  }

  logout(){
    this.userSessionService.logout();
    this.router.navigateByUrl('user-login')
  }
  to3D(){
    this.router.navigateByUrl('3d-test');
  }
  toProfile(){
    this.router.navigateByUrl('profile');
  }
  toUser(){
    this.router.navigateByUrl('user');
  }
}
