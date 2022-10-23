import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';

interface MenuLink {
  id: number | string;
  route: string;
  title: string;
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
  { id: 1, route: '/home', title: 'Home', icon: 'house' },
  { id: 2, route: '/creator', title: 'Creator', icon: 'asterisk' },
  { id: 2, route: '/quizzes', title: 'Quizzes', icon: 'compass' },
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  auth: AuthService;
  appTitle = 'Q U I Z M K R';
  menuLinks: MenuLink[] = MENU_LINKS;
  darkMode: boolean;

  loggedIn: boolean;
  authenticating: boolean;
  authSubscription?: Subscription;

  constructor(private route: ActivatedRoute, private router: Router, auth: AuthService) {
    this.auth = auth;
    this.darkMode = isDarkTheme();

    if (!this.darkMode) {
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('sl-theme-dark');
    }

    this.authSubscription = this.auth.isLoggedIn$.subscribe((loggedIn) => {
      this.toggleMenuLinks(loggedIn);
      this.authenticating = false;
      this.loggedIn = loggedIn;
    });
    this.toggleMenuLinks(this.auth.loggedIn);
    this.authenticating = this.auth.authenticating;
    this.loggedIn = this.auth.loggedIn;
  }

  ngOnInit(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.darkModeListener);
    this.authSubscription?.unsubscribe();
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

  toggleMenuLinks(loggedIn: boolean): void {
    if (loggedIn) {
      this.menuLinks = MENU_LINKS;
    } else {
      this.menuLinks = [MENU_LINKS[0]];
    }
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
}
