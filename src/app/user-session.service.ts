import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginResponse } from './http/login-response.model';
import { LoginRequest } from './http/login-request.model';
import { Subject } from 'rxjs';
import { LoginAPI } from './http/login-api';

// local status for the user session service
enum SessionStatus {
  NotReady = 0,
  Ready = 1,
}

// a local function for token verfication
const checkToken = (token: string) => {
  try{
    let strings = token.split("."); //截取token，获取载体
    var userinfo = JSON.parse(decodeURIComponent(escape(window.atob(strings[1].replace(/-/g, "+").replace(/_/g, "/")))));
    console.log(userinfo)
    return true;
  }
  catch (e) {
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  private token: String | null = null;
  private tokenLocalStorageID = 'JWT';

  private status: SessionStatus = SessionStatus.NotReady;

  constructor(private httpClient: HttpClient) {
    // try to get jwt from local storage
    const token = localStorage.getItem(this.tokenLocalStorageID);

    // verify token here...
    if (token != null){
      if (checkToken(token)) {
        this.token = token;
        this.status = SessionStatus.Ready;
      }
      else{
        this.cleanToken();
      }
    }

  }

  private saveToken(token: string) {
    this.token = token;
    localStorage.setItem(this.tokenLocalStorageID, token);

    this.status = SessionStatus.Ready;
  }

  private cleanToken() {
    this.token = null;
    localStorage.removeItem(this.tokenLocalStorageID);

    this.status = SessionStatus.NotReady;
  }

  login(loginRequest: LoginRequest) {
    // create a subject to multicast values to caller
    const loginSubject = new Subject<LoginResponse>();

    // subscribe to the subject to handle response
    loginSubject.subscribe((response: LoginResponse) => {
      const { token } = response;

      // verify token here...
      if (checkToken(token)) {
        this.saveToken(token);
      }
    });

    // post to get token, and forward the observable to the subject
    new LoginAPI(this.httpClient)
      .createObservable(loginRequest)
      .subscribe({
        next: (res) => loginSubject.next(res),
        error: (err) => loginSubject.error(err),
        complete: () => loginSubject.complete(),
      });

    // return an observable to the caller
    return loginSubject;
  }

  logout() {
    this.cleanToken();
  }

  getIsReady() {
    return this.status == SessionStatus.Ready;
  }

  // return http headers with auth args
  getAuthHeaders() {
    if (this.status == SessionStatus.NotReady) throw Error;

    return {
      'Authorization:': this.token
    }
  }
}
