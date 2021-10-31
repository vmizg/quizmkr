import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, forkJoin, of, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { AssessmentResult, AssessmentResultDetails, Question } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

interface ResultDetails extends AssessmentResultDetails, Question {
  questionTitle: string;
}

interface ResultSheet extends AssessmentResult {
  details: ResultDetails[];
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
  resultSheet?: ResultSheet;
  timeTaken = '';

  loading = true;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    this.resultState = this.router.getCurrentNavigation()?.extras.state?.result || undefined;
  }

  ngOnInit(): void {
    this.loading = true;
    this.paramsSubscription$ = this.route.params
      .pipe(
        concatMap((params) => {
          const id = params.rid;
          return this.resultState ? of(this.resultState) : this.apiService.getResult(id);
        }),
        concatMap((result) => {
          return forkJoin([
            of(result),
            this.apiService.getQuestions(result.assessment.quiz.id)
          ]);
        }),
        tap(([result, questions]) => {
          if (result && questions) {
            this.resultSheet = {
              ...result,
              details: [],
            };
            for (let i = 0; i < result.details.length; i++) {
              const details = result.details[i];
              const resultDetails: ResultDetails = {
                ...details,
                ...questions[details.questionIndex],
                questionTitle: questions[details.questionIndex].title,
              };
              this.resultSheet.details.push(resultDetails);
            }
            let secondsTaken = Math.floor(result.timeTaken / 1000);
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
