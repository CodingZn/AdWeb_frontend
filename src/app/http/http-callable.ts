import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Constructor } from "../utils/constructor";

export enum RequestMethod {
    Get = 'get',
    Post = 'post',
    Put = 'put',
    Delete = 'delete',
}

// http callable mixin
export interface HTTPCallable<Req, Res> {
    url: string;
    method: RequestMethod;

    createObservable: (req: Req, options?: any) => Observable<Res>;
};

// decorator to apply mixin
export function HTTPCallable<T extends Constructor<any>, Req, Res>(Base: T) {
    return class extends Base {
        url!: string;
        method!: RequestMethod;
        private httpClient!: HttpClient;

        constructor(...args: any[]) { super(...args); }

        createObservable(req: Req, options?: any): Observable<Res> {
            let ret;

            // do not use Reflect!!!
            if (this.method == RequestMethod.Get) ret = this.httpClient.get(this.url, { ...options, params: req });
            if (this.method == RequestMethod.Post) ret = this.httpClient.post(this.url, req, options);
            if (this.method == RequestMethod.Put) ret = this.httpClient.put(this.url, req, options);
            if (this.method == RequestMethod.Delete) ret = this.httpClient.delete(this.url, { ...options, params: req });

            return ret as unknown as Observable<Res>;
        }
    }
}