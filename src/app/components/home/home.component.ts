import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { EMPTY, interval, Subject } from 'rxjs';
import { catchError, concatMap, take, takeUntil, tap } from 'rxjs/operators';
import { AssessmentResult, Assessment, Quiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

const defaultParams = {
  order: 'id_desc',
  limit: 10,
};
const defaultUsername = 'stranger';

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
  username = defaultUsername;
  loggedIn = false;

  private results$ = new Subject<void>();
  private quizzes$ = new Subject<void>();
  private destroyed$ = new Subject<void>();

  constructor(private apiService: ApiService, private auth: AuthService) {}

  ngOnInit() {
    interval(1000)
      .pipe(
        tap(() => (this.currentDate = new Date())),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.quizzes$
      .pipe(
        concatMap(() => this.apiService.getQuizzes(defaultParams)),
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

    this.results$
      .pipe(
        concatMap(() => this.apiService.getResults(defaultParams)),
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

    this.auth.user$
      .pipe(
        tap((user) => {
          this.username = (user && (user.nickname || user.name)) || defaultUsername;
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.auth.isAuthenticated$
      .pipe(
        tap((loggedIn) => {
          if (!this.loggedIn && loggedIn) {
            this.quizzes$.next();
            this.results$.next();
          } else {
            this.loadingLatest = false;
            this.loadingResults = false;
          }
          this.loggedIn = loggedIn;
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleLogin() {
    this.auth.loginWithPopup();
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
          tap(() => this.results$.next()),
          take(1)
        )
        .subscribe();
    }
  }
}
