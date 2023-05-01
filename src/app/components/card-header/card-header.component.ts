import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-header',
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss'],
})
export class CardHeaderComponent implements OnInit {
  @Input() icon?: string = '';
  @Input() title?: string = '';
  @Input() subtitle?: string = '';
  @Input() info?: string = '';
  @Input() loading?: boolean = false;
  @Input() visible?: boolean = true;

  constructor() {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {}
}
