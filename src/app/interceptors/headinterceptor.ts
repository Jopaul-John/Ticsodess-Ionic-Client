import { Injectable } from '@angular/core';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { ServicedbService } from '../services/servicedb.service';

/* 
    intercepts every http(s) requests to append the authentication token
    instead of adding in service files, better to intercept and append
*/

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
    constructor(private storage: ServicedbService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let token: string;
        let authType: string;
        token = this.storage.getServiceToken();
        authType = "Token ";
        console.log("token, auth type in interceptor ", token, authType)
        if (token !== null)
            request = request.clone({ headers: request.headers.set('Authorization', authType + token) });
        if (!request.headers.has('Content-Type')) {
            request = request.clone({ headers: request.headers.set('Content-Type', 'application/json') });
        }
        request = request.clone({ headers: request.headers.set('Accept', 'application/json') });

        return next.handle(request)
    }
}