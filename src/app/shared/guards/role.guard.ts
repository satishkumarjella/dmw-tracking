import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const requiredModule = route.data['module']; // e.g. 'shipping'
    
    // For admin route, special handling:
    if (requiredModule === 'admin') {
      return this.authService.currentUser$.pipe(
        take(1),
        map(user => {
          if (user && (user.role === 'admin' || user.role === 'super_admin')) {
            return true;
          }
          this.router.navigate(['/dashboard']);
          return false;
        })
      );
    }

    // For other modules, check if the module is in the user's modules array
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }
        if (user.role === 'super_admin' || user.role === 'admin') {
          return true;
        }
        if (user.modules && user.modules.includes(requiredModule)) {
          return true;
        }
        this.router.navigate(['/dashboard']);
        return false;
      })
    );
  }
}
