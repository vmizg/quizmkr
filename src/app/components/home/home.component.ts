import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseQuiz } from 'src/app/models/quiz';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  inProgress: Omit<BaseQuiz, 'options'>[] = [];
  latest: Omit<BaseQuiz, 'options'>[] = [];
  currentDate = new Date();
  $clockSubscription?: Subscription;

  ngOnInit() {
    this.$clockSubscription = interval(1000).pipe(
      tap(() => this.currentDate = new Date())
    ).subscribe();
  }

  ngOnDestroy() {
    this.$clockSubscription?.unsubscribe();
  }
}
