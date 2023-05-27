import { Observable } from "rxjs";
import { RegisterRequest } from "./register-request.model";
import { RegisterResponse } from "./register-response.model";
import { HttpClient } from "@angular/common/http";
import { CheckUsernameRequest } from "./check-username-request.model";
import { CheckUsernameResponse } from "./check-username-response.model";
import { LoginRequest } from "./login-request.model";
import { LoginResponse } from "./login-response.model";

const baseURL = 'http://localhost:8080';

enum RequestMethod {
    Get = 'get',
    Post = 'post',
    Put = 'put',
    Delete = 'delete',
}

// an interface for callable remote api
export interface RemoteCallable<Request, Response> {
    uri: string;
    method: RequestMethod;

    createObservable(request: Request, options?: any): Observable<Response>;
}

// quick mixin
const universalCreateObservable = <Request, Response>(
    httpClient: HttpClient,
    uri: string,
    method: RequestMethod,
    request: Request,
    options?: any) => {
    let ret;

    // do not use Reflect.get, it is unsafe
    if (method == RequestMethod.Get) ret = httpClient.get(uri, { ...options, params: request });
    if (method == RequestMethod.Post) ret = httpClient.post(uri, request, options);
    if (method == RequestMethod.Put) ret = httpClient.put(uri, request, options);
    if (method == RequestMethod.Delete) ret = httpClient.delete(uri, { ...options, params: request });

    return ret as unknown as Observable<Response>;
};

// check username api
export class CheckUsername implements RemoteCallable<CheckUsernameRequest, CheckUsernameResponse> {
    uri = `${baseURL}/checkUsername`;
    method = RequestMethod.Get;

    constructor(private httpClient: HttpClient) { }

    createObservable(request: CheckUsernameRequest, options?: any): Observable<CheckUsernameResponse> {
        return universalCreateObservable(this.httpClient, this.uri, this.method, request, options);
    }
};

// register api
export class Register implements RemoteCallable<RegisterRequest, RegisterResponse> {
    uri = `${baseURL}/register`;
    method = RequestMethod.Post;

    constructor(private httpClient: HttpClient) { }

    createObservable(request: RegisterRequest, options?: any): Observable<RegisterResponse> {
        return universalCreateObservable(this.httpClient, this.uri, this.method, request, options);
    }
};

// login api
export class Login implements RemoteCallable<LoginRequest, LoginResponse> {
    uri = `${baseURL}/register`;
    method = RequestMethod.Post;

    constructor(private httpClient: HttpClient) { }

    createObservable(request: LoginRequest, options?: any): Observable<LoginResponse> {
        return universalCreateObservable(this.httpClient, this.uri, this.method, request, options);
    }
}