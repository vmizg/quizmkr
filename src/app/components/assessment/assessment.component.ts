import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { catchError, concatMap, takeUntil, tap } from 'rxjs/operators';
import { BaseAssessment } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.scss'],
})
export class AssessmentComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();

  @ViewChild('totalQEl') totalQRef?: ElementRef<HTMLInputElement>;
  @ViewChild('rangeToEl') rangeToRef?: ElementRef<HTMLInputElement>;

  quizId = '';
  quizTitle = '';
  totalQuizQuestions = 0;
  loading = true;
  beginning = false;

  settings: BaseAssessment = {
    randomize: true,
    totalQuestions: 1,
    rangeFrom: 1,
    rangeTo: 1,
  };
  overshoot = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.loading = true;
    this.route.params
      .pipe(
        concatMap((params) => {
          this.quizId = params.qid;
          return this.apiService.getQuiz(this.quizId);
        }),
        tap((quiz) => {
          this.loading = false;
          if (quiz) {
            this.quizTitle = quiz.title;
            this.totalQuizQuestions = quiz.totalQuestions;

            // Default to a maximum of 50 questions in the totalQuestions field
            this.settings.totalQuestions = this.totalQuizQuestions > 50 ? 50 : this.totalQuizQuestions;
            this.settings.rangeTo = this.totalQuizQuestions;
          } else {
            this.router.navigate(['/quizzes']);
          }
        }),
        catchError(() => {
          this.loading = false;
          this.router.navigate(['/quizzes']);
          return EMPTY;
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private checkRangeOvershoot() {
    this.overshoot =
      this.settings.rangeTo - this.settings.rangeFrom + 1 - this.settings.totalQuestions > 0 ? true : false;
  }

  handleTimeLimitInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const timeLimit = Number((e.target as HTMLInputElement).value);
    if (timeLimit >= 0) {
      this.settings.timeLimit = Math.round(timeLimit);
    } else {
      target.value = `${this.settings.timeLimit}`;
    }
  }

  handleTotalQuestionsInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const totalQuestions = Number(target.value);
    if (totalQuestions > 0 && totalQuestions <= this.totalQuizQuestions) {
      this.settings.totalQuestions = totalQuestions;
      this.checkRangeOvershoot();
    } else if (target.value !== '') {
      if (target.value === '0') {
        target.value = '';
      } else {
        target.value = `${this.settings.totalQuestions}`;
      }
    }
  }

  handlePresetClick(presetNum: number) {
    this.settings.totalQuestions = presetNum;
    if (this.totalQRef?.nativeElement) {
      this.totalQRef.nativeElement.value = `${presetNum}`;
    }
    this.checkRangeOvershoot();
  }

  handleRangeFromInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const rangeFrom = Number(target.value);
    if (rangeFrom > 0 && rangeFrom < this.settings.rangeTo && rangeFrom < this.totalQuizQuestions) {
      this.settings.rangeFrom = rangeFrom;
      this.checkRangeOvershoot();
    } else if (target.value !== '') {
      if (target.value === '0') {
        target.value = '';
      } else {
        target.value = `${this.settings.rangeFrom}`;
      }
    }
  }

  handleRangeToInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const rangeTo = Number(target.value);
    if (rangeTo > 0 && rangeTo < this.totalQuizQuestions) {
      this.settings.rangeTo = rangeTo;
      this.checkRangeOvershoot();
    } else if (target.value !== '') {
      if (target.value === '0') {
        target.value = '';
      } else {
        target.value = `${this.settings.rangeTo}`;
      }
    }
  }

  handleRandomizeChange(e: Event) {
    const randomize = (e.target as HTMLInputElement).checked;
    this.settings.randomize = randomize;
    this.checkRangeOvershoot();
  }

  handleBegin() {
    this.beginning = true;

    this.apiService.createAssessment(this.quizId, this.settings).subscribe(
      (result) => {
        this.beginning = false;
        if (result) {
          this.router.navigate(['/assessments', result.id], {
            state: { assessment: result },
          });
        }
      },
      (err) => {
        this.beginning = false;
        console.log(err);
      }
    );
  }
}
