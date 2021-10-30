import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, forkJoin, Subscription } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { BaseAssessmentSettings, QuizQuestion } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { shuffleArray } from 'src/app/utilities';

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
    randomize: true,
    totalQuestions: 1,
    rangeFrom: 1,
    rangeTo: 1,
  };
  overshoot = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

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

            // Default to a maximum of 50 questions in the totalQuestions field
            this.settings.totalQuestions = this.quizQuestions.length > 50 ? 50 : this.quizQuestions.length;
            this.settings.rangeTo = this.quizQuestions.length;
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
    if (totalQuestions > 0 && totalQuestions <= this.quizQuestions.length) {
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
    if (rangeFrom > 0 && rangeFrom < this.settings.rangeTo && rangeFrom < this.quizQuestions.length) {
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
    if (rangeTo > 0 && rangeTo < this.quizQuestions.length) {
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
  }

  handleBegin() {
    this.beginning = true;

    const questions = this.prepareQuestions(this.quizQuestions);
    this.settings.order = questions.map(({ index }) => index);

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

  private prepareQuestions(questions: QuizQuestion[]) {
    const totalQuestions = this.settings.totalQuestions || questions.length;
    const rangeFrom = (this.settings.rangeFrom || 1) - 1; // 0-indexed
    const rangeTo = this.settings.rangeTo || questions.length;

    // We need to save question indexes before we manipulate the list
    // for easier result tracking later
    let indexedQs = questions.map((q, i) => ({ ...q, index: i }) as QuizQuestion);
    indexedQs = indexedQs.slice(rangeFrom, rangeTo);

    if (!this.settings.randomize) {
      return indexedQs.slice(0, totalQuestions);
    }

    const rndQuestions = shuffleArray(indexedQs);
    return rndQuestions.slice(0, totalQuestions);
  }
}
