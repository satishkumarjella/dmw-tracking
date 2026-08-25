import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tenantIdSubject = new BehaviorSubject<string | null>(localStorage.getItem('tenantId'));
  public tenantId$ = this.tenantIdSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserSubject.next({ ...payload, token });
      } catch (e) {
        this.currentUserSubject.next({ token });
      }
    }
  }

  getTenantId() {
    return this.tenantIdSubject.value;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  signup(tenantId: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/signup`, { email, password }, {
      headers: { 'x-tenant-id': tenantId }
    });
  }

  login(tenantId: string, email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }, {
      headers: { 'x-tenant-id': tenantId }
    }).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('tenantId', tenantId);
        this.tenantIdSubject.next(tenantId);
        this.currentUserSubject.next(res.user);
      })
    );
  }

  forgotPassword(tenantId: string, email: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email }, {
      headers: { 'x-tenant-id': tenantId }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    this.tenantIdSubject.next(null);
    this.currentUserSubject.next(null);
  }
}
