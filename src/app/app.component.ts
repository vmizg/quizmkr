import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  userTheme = localStorage.getItem('quizmkr-theme');

  constructor(private router: Router) { }

  ngOnInit(): void {
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.darkModeListener);
  }

  ngOnDestroy(): void {
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.darkModeListener)
  }

  darkModeListener(e: MediaQueryListEvent): void {
    if (!this.userTheme) {
      this.darkMode = e.matches;
    }
  }

  toggleTheme(): void {
    const htmlElement = document.documentElement;
    this.userTheme = this.darkMode ? 'light' : 'dark';
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      if (!htmlElement.classList.contains('sl-theme-dark')) {
        htmlElement.classList.add('sl-theme-dark');
      }
    } else {
      htmlElement.classList.remove('sl-theme-dark');
    }
  }

  isRouteActive(link: any): boolean {
    return this.router.isActive(link.path, true);
  }

  onNavigate(link: any): void {
    const path = [link.path];
    this.router.navigate(path);
  }
}
