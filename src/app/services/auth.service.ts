import { Injectable } from '@angular/core';
import createAuth0Client, { GetTokenSilentlyVerboseResponse, User } from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, of, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { tap, catchError, concatMap, shareReplay, takeWhile } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HOME_ROUTE, REDIRECT_ROUTE } from '../constants';

const REDIRECT_URI = `${window.location.origin}/${REDIRECT_ROUTE}`;

/**
 * Many thanks to the author of:
 * https://medium.com/swlh/using-auth0-to-secure-your-angular-application-and-access-your-asp-net-core-api-1947b9389f4f
 * for the core implementation.
 */

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Create an observable of Auth0 instance of client
  auth0Client$ = (
    from(
      createAuth0Client({
        domain: environment.authClientHostname,
        client_id: environment.authClientId,
        redirect_uri: REDIRECT_URI,
        audience: environment.apiUrl,
      })
    ) as Observable<Auth0Client>
  ).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError((err) => {
      throw err;
    })
  );

  // Is authenticating status
  authenticating: boolean = false;
  private isAuthenticatingSubject$ = new BehaviorSubject<boolean>(false);
  isAuthenticating$ = this.isAuthenticatingSubject$.asObservable();

  // Current login status
  loggedIn: boolean = false;
  private isLoggedInSubject$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject$.asObservable();

  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  private isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client) => from(client.isAuthenticated())),
    tap((res) => this.isLoggedInSubject$.next(res))
  );

  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<User | null>(null);
  userProfile$ = this.userProfileSubject$.asObservable();

  private handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client) => from(client.handleRedirectCallback()))
  );

  constructor(private router: Router) {
    // Always update the local state
    this.isAuthenticating$.subscribe((status) => {
      this.authenticating = status;
    });
    this.isLoggedIn$.subscribe((status) => {
      this.loggedIn = status;
    });
    // On initial load, check authentication state with authorization server
    // Set up local auth streams if user is already authenticated
    this.localAuthSetup();
    // Handle redirect from Auth0 login
    this.handleAuthCallback();
  }

  private storeToken(token: GetTokenSilentlyVerboseResponse) {
    sessionStorage.setItem('JWT', JSON.stringify(token));
  }

  private getToken(): GetTokenSilentlyVerboseResponse | null {
    const token = sessionStorage.getItem('JWT');
    return token ? JSON.parse(token) : null;
  }

  private clearToken(): void {
    sessionStorage.removeItem('JWT');
  }

  getTokenSilently$(options?: any): Observable<GetTokenSilentlyVerboseResponse> {
    // TODO: check expiry
    const token = this.getToken();
    if (token) {
      return of(token);
    }
    return this.auth0Client$.pipe(
      concatMap((client) => from(client.getTokenSilently(options))),
      // Store token locally to avoid querying the server
      tap((token) => this.storeToken(token))
    );
  }

  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?: any): Observable<any> {
    return this.auth0Client$.pipe(
      concatMap((client) => from(client.getUser(options))),
      tap((user) => this.userProfileSubject$.next(user || null))
    );
  }

  private localAuthSetup() {
    this.isAuthenticatingSubject$.next(true);
    // This should only be called on app initialization
    // Set up local authentication streams
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn) => {
        if (loggedIn) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getUser$();
        }
        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      }),
      tap(() => (this.isAuthenticatingSubject$.next(false)))
    );
    return checkAuth$.subscribe();
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client) => {
      // Call method to log in
      client.loginWithRedirect({
        redirect_uri: REDIRECT_URI,
        appState: { target: redirectPath },
      });
    });
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      this.isAuthenticatingSubject$.next(true);
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap((cbRes) => {
          // Get and set target redirect route from callback results
          targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : `/${HOME_ROUTE}`;

          // Never stay at the intermediate page
          if (targetRoute.includes(REDIRECT_ROUTE)) {
            targetRoute = `/${HOME_ROUTE}`;
          }
        }),
        concatMap(() => {
          // Redirect callback complete; get user and login status
          return combineLatest([this.getUser$(), this.isAuthenticated$]);
        })
      );

      // Subscribe to authentication completion observable
      // Response will be an array of user and login status
      authComplete$.subscribe(() => {
        // Redirect to target route after callback processing
        this.router.navigate([targetRoute]);
        this.isAuthenticatingSubject$.next(false);
      });
    } else if (window.location.pathname.includes(REDIRECT_ROUTE)) {
      // Move users back to the home page if they manually land on redirect route
      if (this.authenticating) {
        this.isAuthenticating$.pipe(
          tap((authenticating) => {
            if (!authenticating) {
              this.router.navigate([HOME_ROUTE]);
            }
          }),
          takeWhile((authenticating) => authenticating)
        ).subscribe();
      } else {
        this.router.navigate([HOME_ROUTE]);
      }
    }
  }

  logout() {
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client) => {
      this.clearToken();
      // Call method to log out
      client.logout({
        client_id: environment.authClientId,
        returnTo: `${window.location.origin}`,
      });
    });
  }
}
