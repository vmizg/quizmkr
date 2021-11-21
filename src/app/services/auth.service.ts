import { Injectable } from '@angular/core';
import createAuth0Client, { GetTokenSilentlyVerboseResponse } from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, of, Observable, BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
        redirect_uri: `${window.location.origin}`,
        audience: environment.apiUrl,
      })
    ) as Observable<Auth0Client>
  ).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError((err) => throwError(err))
  );

  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client) => from(client.isAuthenticated())),
    tap((res) => (this.loggedIn = res))
  );

  handleRedirectCallback$ = this.auth0Client$.pipe(concatMap((client) => from(client.handleRedirectCallback())));

  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject$.asObservable();

  // Create a local property for login status
  loggedIn: boolean = false;

  constructor(private router: Router) {
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
      tap((user) => this.userProfileSubject$.next(user))
    );
  }

  private localAuthSetup() {
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
      })
    );
    checkAuth$.subscribe();
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client) => {
      // Call method to log in
      client.loginWithRedirect({
        redirect_uri: `${window.location.origin}`,
        appState: { target: redirectPath },
      });
    });
  }

  private handleAuthCallback() {
    // Call when app reloads after user logs in with Auth0
    const params = window.location.search;
    if (params.includes('code=') && params.includes('state=')) {
      let targetRoute: string; // Path to redirect to after login processsed
      const authComplete$ = this.handleRedirectCallback$.pipe(
        // Have client, now call method to handle auth callback redirect
        tap((cbRes) => {
          // Get and set target redirect route from callback results
          targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
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
      });
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
