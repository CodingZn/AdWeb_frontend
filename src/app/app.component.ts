import { Component, OnInit } from '@angular/core';
import { UserSessionService } from './user-session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Web Project';

  constructor(
    private userSessionSerivce: UserSessionService,
    private router: Router) {}

  ngOnInit(): void {
    // if not logged in, redirect to login
    // todo 开发阶段先放行
    // if(!this.userSessionSerivce.getIsReady()) {
    //   this.router.navigate(['user-login']);
    // }
  }
}
