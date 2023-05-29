import {HTTPCallable, RequestMethod} from "./http-callable";
import {baseURL} from "./config";
import {Observable} from "rxjs";
import {ChooseProfileRequest, GetUserinfoResponse, PutUserinfoRequest} from "./userinfo.model";
import {HttpClient} from "@angular/common/http";
import {MessageResponse} from "./message-response.model";

@HTTPCallable
export class GetUserinfoApi implements HTTPCallable<any, GetUserinfoResponse>{
  createObservable!:(req: any, options?: any)=> Observable<GetUserinfoResponse>;
  method = RequestMethod.Get;
  url = `${baseURL}/user/`+this.uid;

  constructor(private httpClient: HttpClient,
              private uid:string) {
  }
}

@HTTPCallable
export class PutUserinfoApi implements HTTPCallable<PutUserinfoRequest, MessageResponse>{
  createObservable!:(req: any, options?: any)=> Observable<MessageResponse>;
  method = RequestMethod.Put;
  url = `${baseURL}/user/`+this.uid;

  constructor(private httpClient: HttpClient,
              private uid:string) {
  }
}

@HTTPCallable
export class ChooseProfileApi implements HTTPCallable<ChooseProfileRequest, MessageResponse>{
  createObservable!:(req: any, options?: any)=> Observable<MessageResponse>;
  method = RequestMethod.Post;
  url = `${baseURL}/user/`+this.uid + "/profile";

  constructor(private httpClient: HttpClient,
              private uid:string) {
  }
}
