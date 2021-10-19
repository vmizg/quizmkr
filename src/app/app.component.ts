import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  sidenavLinks = [
    { id: 1, path: '/home', title: 'Home', icon: 'house' },
    { id: 2, path: '/creator', title: 'Creator', icon: 'asterisk' },
  ]
}
