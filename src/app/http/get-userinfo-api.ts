import {HTTPCallable, RequestMethod} from "./http-callable";
import {GetUserinfoRequest} from "./get-userinfo-request-model";
import {baseURL} from "./config";
import {Observable} from "rxjs";
import {GetUserinfoResponse} from "./get-userinfo-response-model";
import {HttpClient} from "@angular/common/http";

@HTTPCallable
export class GetUserinfoApi implements HTTPCallable<GetUserinfoRequest, GetUserinfoResponse>{
  createObservable!:(req: GetUserinfoRequest, options?: any)=> Observable<GetUserinfoResponse>;
  method = RequestMethod.Get;
  url = `${baseURL}/user/`+this.uid;

  constructor(private httpClient: HttpClient,
              private uid:string) {
  }
}
