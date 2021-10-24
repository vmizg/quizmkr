import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, forkJoin, of, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { AssessmentResult, QOption } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

interface Result {
  questionTitle: string,
  questionId: string,
  options: QOption[],
  answeredCorrectly: boolean,
  correctAnswer: number[],
  selectedAnswer: number[],
}

interface ResultSheet {
  quizTitle: string,
  score: number;
  timeTaken: string;
  results: Result[],
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {
  private paramsSubscription$?: Subscription;

  alphabet = 'ABCDEFGHIJKLMNO';
  resultState?: AssessmentResult;
  resultSheet: ResultSheet = {
    quizTitle: '',
    results: [],
    timeTaken: '',
    score: -1,
  };

  loading = true;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    this.resultState = this.router.getCurrentNavigation()?.extras.state?.results || undefined;
  }

  ngOnInit(): void {
    this.loading = true;
    this.paramsSubscription$ = this.route.params.pipe(
      concatMap((params) => {
        const id = params.rid;
        return this.resultState ? of(this.resultState) : this.apiService.getResult(id);
      }),
      concatMap((results) => {
        return forkJoin([of(results), this.apiService.getQuestions(results.quizId)])
      }),
      tap(([results, questions]) => {
        if (results && questions) {
          this.resultSheet.quizTitle = results.quizTitle;
          this.resultSheet.score = results.score;
          for (let i = 0; i < results.details.length; i++) {
            const result: Result = {
              ...results.details[i],
              ...questions.questions[i],
              questionTitle: questions.questions[i].title,
            };
            this.resultSheet.results.push(result);
          }
          let secondsTaken = Math.round(results.timeTaken / 1000);
          let minutesTaken = 0;
          if (secondsTaken >= 60) {
            minutesTaken = Math.round(secondsTaken / 60);
            secondsTaken -= 60;
          }
          let timeTakenStr = `${secondsTaken}s`;
          if (minutesTaken) {
            timeTakenStr = `${minutesTaken} minute${minutesTaken > 1 ? 's' : ''} ${timeTakenStr}`;
          }
          this.resultSheet.timeTaken = timeTakenStr;
        }
        this.loading = false;
      }),
      catchError(() => {
        this.loading = false;
        return EMPTY;
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
  }
}
