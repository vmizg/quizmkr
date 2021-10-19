import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

const THEME_KEY = 'quizmkr-theme';

const isDarkTheme = (): boolean => {
  const userTheme = localStorage.getItem(THEME_KEY);
  return userTheme === 'dark' || !userTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  appTitle = 'Q U I Z M K R';
  menuLinks = [
    { id: 1, path: '/home', title: 'Home', icon: 'house' },
    { id: 2, path: '/creator', title: 'Creator', icon: 'asterisk' },
    { id: 3, path: '/assessment', title: 'Assessment', icon: 'lightbulb' },
  ];
  darkMode: boolean;

  constructor(private router: Router) {
    this.darkMode = isDarkTheme();
    if (!this.darkMode) {
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('sl-theme-dark');
    }
  }

  ngOnInit(): void {
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy(): void {
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.darkModeListener)
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

  isRouteActive(link: any): boolean {
    return this.router.isActive(link.path, true);
  }

  onNavigate(link: any): void {
    const path = [link.path];
    this.router.navigate(path);
  }
}
