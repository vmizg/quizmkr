import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, interval, Subject } from 'rxjs';
import { catchError, concatMap, takeUntil, tap } from 'rxjs/operators';
import { AssessmentResult, Assessment, Quiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

const defaultParams = {
  order: 'id_desc',
  limit: 10,
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  loadingInProgress = false;
  inProgress: Assessment[] = [];
  loadingResults = true;
  results: AssessmentResult[] = [];
  loadingLatest = true;
  latest: Quiz[] = [];
  currentDate = new Date();
  username = 'stranger';

  private destroyed$ = new Subject<void>();

  constructor(private apiService: ApiService, private auth: AuthService) {
    this.auth.userProfile$
      .pipe(
        tap((user) => {
          this.username = user ? user.nickname || user.name || 'stranger' : 'stranger';
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnInit() {
    interval(1000)
      .pipe(
        tap(() => (this.currentDate = new Date())),
        takeUntil(this.destroyed$)
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
        }),
        takeUntil(this.destroyed$)
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
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
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
