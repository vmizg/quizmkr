import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  auth: AuthService;
  appTitle = 'Q U I Z M K R';
  menuLinks: MenuLink[] = [
    { id: 1, route: '/home', title: 'Home', icon: 'house' },
    { id: 2, route: '/creator', title: 'Creator', icon: 'asterisk' },
    { id: 2, route: '/quizzes', title: 'Quizzes', icon: 'compass' },
  ];
  darkMode: boolean;

  constructor(private route: ActivatedRoute, private router: Router, auth: AuthService) {
    this.auth = auth;
    this.darkMode = isDarkTheme();
    if (!this.darkMode) {
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('sl-theme-dark');
    }
  }

  ngOnInit(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy(): void {
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.darkModeListener);
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
}
