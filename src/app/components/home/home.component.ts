import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, interval, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
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
      .getAssessments('?_order=desc&_limit=8&finished_ne=true')
      .pipe(
        tap((data) => {
          this.loadingInProgress = false;
          if (data) {
            this.inProgress = data;
          }
        }),
        catchError(() => {
          this.loadingInProgress = false;
          return EMPTY;
        })
      )
      .subscribe();

    this.apiService
      .getQuizzes('?_order=desc&_limit=8')
      .pipe(
        tap((data) => {
          this.loadingLatest = false;
          if (data) {
            this.latest = data;
          }
        }),
        catchError(() => {
          this.loadingLatest = false;
          return EMPTY;
        })
      )
      .subscribe();

    this.apiService
      .getResults('?_order=desc&_limit=8')
      .pipe(
        tap((data) => {
          this.loadingResults = false;
          if (data) {
            this.results = data;
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

  handleDeleteResult(result: AssessmentResult) {
    if (
      confirm(
        `WARNING: this will permanently clear your past assessment result for "${result.quizTitle}". Do you want continue?`
      )
    ) {
      this.apiService
        .deleteResult(result.id)
        .pipe(
          // TODO: refactor this to reuse the same function as called in ngOnInit
          concatMap(() => this.apiService.getResults('?_order=desc&_limit=8')),
          tap((data) => {
            this.loadingResults = false;
            if (data) {
              this.results = data;
            }
          })
        )
        .subscribe();
    }
  }
}
