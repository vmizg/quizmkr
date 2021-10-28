import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, forkJoin, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { BaseAssessmentSettings, QuizQuestion } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.scss'],
})
export class AssessmentComponent implements OnInit {
  private paramsSubscription$?: Subscription;

  @ViewChild('totalQEl') totalQRef?: ElementRef<HTMLInputElement>;
  @ViewChild('rangeToEl') rangeToRef?: ElementRef<HTMLInputElement>;

  quizId = '';
  quizTitle = '';
  quizQuestions: QuizQuestion[] = [];
  loading = true;
  beginning = false;

  settings: BaseAssessmentSettings = {
    randomize: false,
    totalQuestions: 1,
    rangeFrom: 1,
    rangeTo: 1,
    timeLimit: 0,
  };
  overshoot = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.loading = true;
    this.paramsSubscription$ = this.route.params
      .pipe(
        concatMap((params) => {
          this.quizId = params.qid;
          return forkJoin([this.apiService.getQuiz(this.quizId), this.apiService.getQuestions(this.quizId)]);
        }),
        tap(([quiz, questions]) => {
          this.loading = false;
          if (quiz) {
            this.quizTitle = quiz.title;
            this.quizQuestions = questions?.questions || [];
            this.settings.totalQuestions = this.quizQuestions.length;
            this.settings.rangeTo = this.settings.totalQuestions;
          } else {
            this.router.navigate(['/quizzes']);
          }
        }),
        catchError(() => {
          this.loading = false;
          this.router.navigate(['/quizzes']);
          return EMPTY;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
  }

  private checkRangeOvershoot() {
    this.overshoot =
      this.settings.rangeTo - this.settings.rangeFrom + 1 - this.settings.totalQuestions > 0 ? true : false;
  }

  handleTimeLimitInput(e: Event) {
    const timeLimit = Number((e.target as HTMLInputElement).value);
    this.settings.timeLimit = timeLimit;
  }

  handleTotalQuestionsInput(e: Event) {
    const totalQuestions = Number((e.target as HTMLInputElement).value);
    if (totalQuestions <= this.quizQuestions.length) {
      this.settings.totalQuestions = totalQuestions;
      this.checkRangeOvershoot();
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
    const rangeFrom = Number((e.target as HTMLInputElement).value);
    this.settings.rangeFrom = rangeFrom;
    this.checkRangeOvershoot();
  }

  handleRangeToInput(e: Event) {
    const rangeTo = Number((e.target as HTMLInputElement).value);
    this.settings.rangeTo = rangeTo;
    this.checkRangeOvershoot();
  }

  handleRandomizeChange(e: Event) {
    const randomize = (e.target as HTMLInputElement).checked;
    this.settings.randomize = randomize;
  }

  handleBegin() {
    this.beginning = true;
    this.apiService.createAssessment(this.quizId, this.quizTitle, this.settings).subscribe(
      (result) => {
        this.beginning = false;
        if (result) {
          this.router.navigate(['/quizzes', this.quizId, 'assessment', result.id], {
            state: { settings: result, questions: this.quizQuestions },
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
