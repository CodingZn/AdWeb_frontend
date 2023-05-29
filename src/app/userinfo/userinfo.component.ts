import { Component } from '@angular/core';
import {UserSessionService} from "../user-session.service";
import {GetUserinfoApi, PutUserinfoApi} from "../http/userinfo-api";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {GetUserinfoResponse} from "../http/userinfo.model";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-userinfo',
  templateUrl: './userinfo.component.html',
  styleUrls: ['./userinfo.component.css']
})
export class UserinfoComponent {
  editing: boolean = false;
  userinfo : GetUserinfoResponse | null = null;
  form: FormGroup = this.formBuilder.group({
    nickname: new FormControl(this.userinfo?.nickname),
    phone: new FormControl(this.userinfo?.phone),
    email: new FormControl(this.userinfo?.email),
  });

  constructor(private userSessionService: UserSessionService,
              private httpClient: HttpClient,
              private router:Router,
              private formBuilder: FormBuilder,
              ) {
    let info = userSessionService.getTokenInfo();
    if (info){
      new GetUserinfoApi(this.httpClient, info.id.toString())
        .createObservable({}, {headers: userSessionService.getAuthHeaders()},)
        .subscribe({
          next: (res) => {
            console.log(res)
            this.userinfo = res;
            this.form = this.formBuilder.group({
              nickname: new FormControl(this.userinfo?.nickname),
              phone: new FormControl(this.userinfo?.phone),
              email: new FormControl(this.userinfo?.email),
            });
          },
          error:(err => {
            console.log(err)
            window.alert(err.error.message)
          })
        })
    }
    else{
      this.router.navigateByUrl('login')
    }
  }

  edit(){
    this.editing = true;
  }
  submit(){
    new PutUserinfoApi(this.httpClient, this.userinfo!.id.toString())
      .createObservable(this.form.value, {headers: this.userSessionService.getAuthHeaders()})
      .subscribe({
        next: (res)=>{
          window.alert(res.message)
          this.editing = false;
          this.router.navigateByUrl('user')
        },
        error:(err=>{
          window.alert(err.error.message)
        })
      })
  }
  cancel(){
    this.editing = false;
  }

}
