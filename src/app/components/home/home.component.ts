import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, interval, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { AssessmentResult, Assessment, Quiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

const defaultParams = {
  order: 'id_desc',
  limit: 8,
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private clockSubscription$?: Subscription;

  loadingInProgress = true;
  inProgress: Assessment[] = [];
  loadingResults = true;
  results: AssessmentResult[] = [];
  loadingLatest = true;
  latest: Quiz[] = [];
  currentDate = new Date();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.clockSubscription$ = interval(1000)
      .pipe(tap(() => (this.currentDate = new Date())))
      .subscribe();

    this.apiService
      .getAssessments(defaultParams)
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
      .getQuizzes(defaultParams)
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
      .getResults(defaultParams)
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
    const quizTitle = result.assessment.quiz.title;
    if (
      confirm(
        `WARNING: this will permanently clear your past assessment result for "${quizTitle}". Do you want continue?`
      )
    ) {
      this.apiService
        .deleteResult(result.id)
        .pipe(
          // TODO: refactor this to reuse the same function as called in ngOnInit
          concatMap(() => {
            return this.apiService.getResults(defaultParams);
          }),
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
