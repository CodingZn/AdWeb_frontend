import { HttpClient } from "@angular/common/http";
import { HTTPCallable, RequestMethod } from "./http-callable";
import { CheckUsernameRequest } from "./check-username-request.model";
import { CheckUsernameResponse } from "./check-username-response.model";
import { baseURL } from "./config";
import { Observable } from "rxjs";

@HTTPCallable
export class CheckUsernameAPI implements HTTPCallable<CheckUsernameRequest, CheckUsernameResponse> {
    url = `${baseURL}/checkUsername`;
    method = RequestMethod.Get;

    constructor(private httpClient: HttpClient) { }

    createObservable!: (request: CheckUsernameRequest, options?: any) => Observable<CheckUsernameResponse>;
};