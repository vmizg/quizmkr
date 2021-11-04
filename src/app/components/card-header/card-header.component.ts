import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss'],
})
export class CardHeaderComponent implements OnInit {
  @Input('icon') icon?: string = '';
  @Input('title') title?: string = '';
  @Input('subtitle') subtitle?: string = '';
  @Input('loading') loading?: boolean = false;
  @Input('visible') visible?: boolean = true;

  constructor() {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {}
}
