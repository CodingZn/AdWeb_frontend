import { Component } from '@angular/core';
import {UserSessionService} from "../user-session.service";
import {GetUserinfoApi} from "../http/get-userinfo-api";
import {GetUserinfoRequest} from "../http/get-userinfo-request-model";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Component({
  selector: 'app-userinfo',
  templateUrl: './userinfo.component.html',
  styleUrls: ['./userinfo.component.css']
})
export class UserinfoComponent {
  aa:GetUserinfoRequest = {};
  constructor(private userSessionService: UserSessionService,
              private httpClient: HttpClient
              ) {

    new GetUserinfoApi(this.httpClient,"11")
      .createObservable(this.aa, {headers: userSessionService.getAuthHeaders()},).subscribe({
      next: (res) => {
        console.log(res)
      },
      error:(err => {
        console.log(err)
        window.alert(err.error.message)
      })

    })
  }


}
