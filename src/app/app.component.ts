import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';

interface MenuLink {
  id: number | string;
  route: string;
  title?: string;
  public?: boolean;
  icon: string;
}

const THEME_KEY = 'quizmkr-theme';

const isDarkTheme = (): boolean => {
  const userTheme = localStorage.getItem(THEME_KEY);
  return (
    userTheme === 'dark' ||
    (!userTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
};

const MENU_LINKS = [
  { id: 1, route: '/home', title: 'Home', icon: 'house', public: true },
  { id: 2, route: '/library', title: 'Library', icon: 'book' },
  { id: 2, route: '/creator', title: 'Create', icon: 'magic' },
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  authenticating$?: Subscription;
  loggedIn$?: Subscription;

  auth: AuthService;
  menuLinks: MenuLink[] = MENU_LINKS;
  breadcrumbs = [];
  darkMode: boolean;

  authenticating = true;
  loggedIn = false;
  username = '';

  constructor(private route: ActivatedRoute, private router: Router, auth: AuthService) {
    this.auth = auth;
    this.darkMode = isDarkTheme();

    if (!this.darkMode) {
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('sl-theme-dark');
    }

    this.authenticating$ = this.auth.isLoading$.subscribe((status) => {
      this.authenticating = status;
    });
    this.loggedIn$ = this.auth.isAuthenticated$.subscribe((loggedIn) => {
      this.loggedIn = loggedIn;
    });
  }

  ngOnInit(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.darkModeListener);
    this.authenticating$?.unsubscribe();
    this.loggedIn$?.unsubscribe();
  }

  darkModeListener(e: MediaQueryListEvent): void {
    const userTheme = localStorage.getItem(THEME_KEY);
    if (!userTheme) {
      this.darkMode = e.matches;
    }
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    const htmlElement = document.documentElement;
    if (this.darkMode) {
      if (!htmlElement.classList.contains('sl-theme-dark')) {
        htmlElement.classList.add('sl-theme-dark');
      }
    } else {
      htmlElement.classList.remove('sl-theme-dark');
    }
    localStorage.setItem(THEME_KEY, this.darkMode ? 'dark' : 'light');
  }

  isRouteActive(link: MenuLink): boolean {
    return this.router.isActive(this.router.createUrlTree([link.route], { relativeTo: this.route }).toString(), {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  onNavigate(link: MenuLink): void {
    const route = [link.route];
    this.router.navigate(route);
  }

  handleLogin() {
    this.auth.loginWithPopup();
  }

  handleLogout() {
    this.auth.logout();
  }
}
