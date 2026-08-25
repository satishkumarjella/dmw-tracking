import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const tenantId = this.authService.getTenantId();

    let authReq = request;
    
    // Set headers if available
    if (token || tenantId) {
      let headers = request.headers;
      
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      
      if (tenantId && !headers.has('x-tenant-id')) {
        headers = headers.set('x-tenant-id', tenantId);
      }
      
      authReq = request.clone({ headers });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
