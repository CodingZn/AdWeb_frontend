import { HttpClient } from "@angular/common/http";
import { HTTPCallable, RequestMethod } from "./http-callable";
import { baseURL } from "./config";
import { RegisterRequest } from "./register-request.model";
import { RegisterResponse } from "./register-response.model";
import { Observable } from "rxjs";

@HTTPCallable
export class RegisterAPI implements HTTPCallable<RegisterRequest, RegisterResponse> {
    url = `${baseURL}/register`;
    method = RequestMethod.Post;

    constructor(private httpClient: HttpClient) { }

    createObservable!: (req: RegisterRequest, options?: any) => Observable<RegisterResponse>;
};