import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, forkJoin, of, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { AssessmentResult, QuizQuestion } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

interface Result extends QuizQuestion {
  questionTitle: string;
  questionId: string;
  questionIndex: number;
  answeredCorrectly: boolean;
  correctAnswer: number[];
  selectedAnswer: number[];
}

interface ResultSheet extends AssessmentResult {
  results: Result[];
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit, OnDestroy {
  private paramsSubscription$?: Subscription;

  alphabet = 'ABCDEFGHIJKLMNO';
  resultState?: AssessmentResult;
  resultSheet: ResultSheet = {
    id: '',
    quizId: '',
    quizTitle: '',
    assessmentId: '',
    dateCompleted: new Date(),
    timeTaken: 0,
    results: [],
    details: [],
    score: -1,
  };
  timeTaken = '';

  loading = true;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    this.resultState = this.router.getCurrentNavigation()?.extras.state?.results || undefined;
  }

  ngOnInit(): void {
    this.loading = true;
    this.paramsSubscription$ = this.route.params
      .pipe(
        concatMap((params) => {
          const id = params.rid;
          return this.resultState ? of(this.resultState) : this.apiService.getResult(id);
        }),
        concatMap((results) => {
          return forkJoin([of(results), this.apiService.getQuestions(results.quizId)]);
        }),
        tap(([results, questions]) => {
          if (results && questions) {
            this.resultSheet = {
              ...results,
              results: [],
            };
            for (let i = 0; i < results.details.length; i++) {
              const details = results.details[i];
              const result: Result = {
                ...details,
                ...questions.questions[details.questionIndex],
                questionTitle: questions.questions[details.questionIndex].title,
              };
              this.resultSheet.results.push(result);
            }
            let secondsTaken = Math.floor(results.timeTaken / 1000);
            let minutesTaken = 0;
            if (secondsTaken >= 60) {
              minutesTaken = Math.floor(secondsTaken / 60);
              secondsTaken -= minutesTaken * 60;
            }
            let timeTakenStr = `${secondsTaken}s`;
            if (minutesTaken) {
              timeTakenStr = `${minutesTaken} minute${minutesTaken > 1 ? 's' : ''} ${timeTakenStr}`;
            }
            this.timeTaken = timeTakenStr;
          }
          this.loading = false;
        }),
        catchError(() => {
          this.loading = false;
          return EMPTY;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
  }
}
