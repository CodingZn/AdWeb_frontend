import { HttpClient } from "@angular/common/http";
import { HTTPCallable, RequestMethod } from "./http-callable";
import { baseURL } from "./config";
import { LoginRequest } from "./login-request.model";
import { LoginResponse } from "./login-response.model";
import { Observable } from "rxjs";

@HTTPCallable
export class LoginAPI implements HTTPCallable<LoginRequest, LoginResponse> {
    url = `${baseURL}/login`;
    method = RequestMethod.Post;

    constructor(private httpClient: HttpClient) { }

    createObservable!: (req: LoginRequest, options?: any) => Observable<LoginResponse>;
}