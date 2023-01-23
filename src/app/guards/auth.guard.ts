import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { REDIRECT_ROUTE } from '../constants';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.isLoggedIn$.pipe(map((loggedIn) => {
      if (loggedIn) {
        return true;
      }
      if (!state.url.includes(REDIRECT_ROUTE)) {
        this.router.navigate([REDIRECT_ROUTE]).then(() => {
          this.auth.login(state.url);
        });
      }
      return false;
    }))
  }
}
