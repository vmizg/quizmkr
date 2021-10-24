import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, interval, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AssessmentResult, AssessmentSettings, BaseQuiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private clockSubscription$?: Subscription;

  loadingInProgress = true;
  inProgress: AssessmentSettings[] = [];
  loadingResults = true;
  results: AssessmentResult[] = [];
  loadingLatest = true;
  latest: BaseQuiz[] = [];
  currentDate = new Date();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.clockSubscription$ = interval(1000)
      .pipe(tap(() => (this.currentDate = new Date())))
      .subscribe();

    this.apiService
      .getAssessments('?_order=desc&_limit=10')
      .pipe(
        tap((data) => {
          this.loadingInProgress = false;
          if (data) {
            this.inProgress = data.reverse();
          }
        }),
        catchError(() => {
          this.loadingInProgress = false;
          return EMPTY;
        })
      )
      .subscribe();

    this.apiService
      .getQuizzes('?_order=desc&_limit=5')
      .pipe(
        tap((data) => {
          this.loadingLatest = false;
          if (data) {
            this.latest = data.reverse();
          }
        }),
        catchError(() => {
          this.loadingLatest = false;
          return EMPTY;
        })
      )
      .subscribe();

    this.apiService
      .getResults('?_order=desc&_limit=10')
      .pipe(
        tap((data) => {
          this.loadingResults = false;
          if (data) {
            this.results = data.reverse();
          }
        }),
        catchError(() => {
          this.loadingResults = false;
          return EMPTY;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.clockSubscription$?.unsubscribe();
  }
}
