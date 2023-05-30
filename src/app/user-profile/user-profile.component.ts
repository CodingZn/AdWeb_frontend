import { Component } from '@angular/core';
import {UserSessionService} from "../user-session.service";
import {HttpClient} from "@angular/common/http";
import {ChooseProfileApi, GetUserinfoApi} from "../http/userinfo-api";
import {ChooseProfileRequest} from "../http/userinfo.model";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  id: number;
  profileID: number=0;

  constructor(
    private httpClient: HttpClient,
    private userSessionService: UserSessionService) {
    this.id = userSessionService.getTokenInfo()!.id;

    new GetUserinfoApi(this.httpClient, this.id.toString())
      .createObservable({}, {headers: userSessionService.getAuthHeaders()},)
      .subscribe({
        next: (res) => {
          this.profileID = res.profileID;
          }
        ,
        error:(err => {
          console.log(err)
          window.alert(err.error.message)
        })
      })
  }

  submit(value: string){
    let req:ChooseProfileRequest={profileID: parseInt(value)};

    console.log(value)
    new ChooseProfileApi(this.httpClient, this.id.toString())
      .createObservable(req, {headers: this.userSessionService.getAuthHeaders()})
      .subscribe({
        next: (res)=>{
          window.alert(res.message);
        },
        error: (err)=>{
          window.alert(err.error.message);
        }
      })
  }
}
