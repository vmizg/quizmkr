import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { AssessmentResult, AssessmentResultDetails, Option } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit, OnDestroy {
  private paramsSubscription$?: Subscription;

  alphabet = 'ABCDEFGHIJKLMNO';
  resultState?: AssessmentResult;
  resultSheet?: AssessmentResult;
  answeredCorrectly = 0;
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
        tap((result) => {
          if (result && result.details) {
            this.resultSheet = result;
            this.answeredCorrectly = result.details.filter(({ answeredCorrectly }) => answeredCorrectly).length;
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

  isSelected(result: AssessmentResultDetails, option: Option) {
    return result.selectedAnswer.includes(option.id);
  }
}
