import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, interval, Subject, EMPTY, ReplaySubject } from 'rxjs';
import { catchError, concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { Assessment, AssessmentResult, BaseAssesmentResult, Question } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

interface PQuestion extends Question {
  completed?: boolean;
  multiSelect?: boolean;
  selectedAnswer?: Set<string>;
}

interface PRadioQuestion extends PQuestion {
  multiSelect: false;
}

interface PCheckboxQuestion extends PQuestion {
  multiSelect: true;
}

interface AssessmentRouteState {
  assessment?: Assessment;
}

interface SlDialog extends HTMLElement {
  show: () => void;
  hide: () => void;
}

@Component({
  selector: 'app-running-assessment',
  templateUrl: './running.component.html',
  styleUrls: ['./running.component.scss'],
})
export class RunningAssessmentComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  private interval$?: Subscription;
  private image$ = new ReplaySubject<{ current: string; upcoming: string }>();
  private upcomingImage$ = new ReplaySubject<string>();
  private timeLimit$ = new Subject();

  @ViewChild('timesUpDialog')
  timesUpDialog?: ElementRef<SlDialog>;

  @ViewChild('successDialog')
  successDialog?: ElementRef<SlDialog>;

  alphabet = 'ABCDEFGHIJKLMNO';
  dataState?: AssessmentRouteState;
  settings?: Assessment;
  questions: PQuestion[] = [];
  activeQuestion?: PRadioQuestion | PCheckboxQuestion;
  activeQuestionIndex = 0;
  startTime: number = 0;
  timeLeft?: number;
  result?: AssessmentResult;

  loading = true;
  image = '';
  imageLoading = false;
  imageCache: { [key: string]: string } = {};

  submitting = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    this.dataState = this.router.getCurrentNavigation()?.extras.state as AssessmentRouteState;
  }

  ngOnInit(): void {
    this.loading = true;
    this.route.params
      .pipe(
        concatMap((params) => {
          const { assessment } = this.dataState || {};
          if (assessment && assessment.questions) {
            return of(assessment as Assessment);
          }
          return this.apiService.getAssessment(params.aid, true);
        }),
        tap((assessment) => {
          this.settings = assessment;
          this.questions = assessment.questions;
          this.setActiveQuestion(0);
          this.startTime = new Date().getTime();
          this.setupTimer(this.settings.timeLimit);
          this.loading = false;
        }),
        catchError(() => {
          this.loading = false;
          this.router.navigate(['/quizzes']);
          return EMPTY;
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.image$
      .pipe(
        concatMap((data) => {
          const { current, upcoming } = data || {};
          if (!current && !upcoming) {
            // Questions contain no images
            return of('');
          }

          const upcomingPic = this.imageCache[upcoming];
          if (upcoming && !upcomingPic) {
            // Signal to download the upcoming picture.
            this.upcomingImage$.next(upcoming);
          }

          if (!current) {
            // Current question has no picture, skip.
            return of('');
          }

          const currentPic = this.imageCache[current];
          if (currentPic) {
            // Current picture in cache, nothing else to do.
            return of(currentPic);
          }

          this.imageLoading = true;

          // Fetch the current picture.
          return this.apiService.getImage(current).pipe(
            map(({ image }) => {
              this.imageCache[current] = image;
              return image;
            }),
            catchError(() => of(''))
          );
        }),
        tap((image) => {
          this.image = image;
          this.imageLoading = false;
        })
      )
      .subscribe();

    this.upcomingImage$
      .pipe(
        concatMap((upcoming) => {
          if (!upcoming) {
            return of('');
          }
          const upcomingPic = this.imageCache[upcoming];
          if (upcomingPic) {
            return of('');
          }
          return this.apiService.getImage(upcoming).pipe(
            map(({ image }) => {
              this.imageCache[upcoming] = image;
              return image;
            })
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();

    this.interval$?.unsubscribe();

    this.image$.next({ current: '', upcoming: '' });
    this.image$.complete();

    this.upcomingImage$.next('');
    this.upcomingImage$.complete();
  }

  private checkIfFinished() {
    let finished = true;
    let unfinishedIndex = -1;
    console.log(this.questions);
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      const answered = q.selectedAnswer && q.selectedAnswer.size > 0;
      if (!answered) {
        finished = false;
        unfinishedIndex = i;
        break;
      }
    }
    return { finished, unfinishedIndex };
  }

  private getSubmissionDetails() {
    return this.questions.map((q) => {
      return {
        questionId: q.id,
        selectedAnswer: q.selectedAnswer ? Array.from(q.selectedAnswer) : [],
      };
    });
  }

  private setupTimer(timeLimit?: number) {
    if (!timeLimit) {
      return;
    }
    this.timeLeft = timeLimit * 60; // In seconds
    this.interval$ = interval(1000)
      .pipe(
        takeUntil(this.timeLimit$),
      )
      .subscribe({
        next: () => {
          this.timeLeft!--;
          if (this.timeLeft !== undefined && this.timeLeft <= 0) {
            this.timeLimit$.next('');
            this.timeLimit$.complete();
          }
        },
        complete: () => {
          this.timesUpDialog?.nativeElement.show();
        }
      });
  }

  getTimer() {
    let total = this.timeLeft!;

    let hours: string | number = Math.floor(total / 3600);
    total = total - hours * 3600;

    let minutes: string | number = Math.floor(total / 60);
    total = total - minutes * 60;

    let seconds: string | number = total;

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    let time = `${minutes}:${seconds}`;
    if (hours >= 1) {
      time = `${hours}:${time}`;
    }

    return time;
  }

  closeTimesUpDialog() {
    this.timesUpDialog?.nativeElement.hide();
  }

  submitAssessment() {
    if (!this.settings) {
      // Sanity check, should never execute
      return;
    }
    this.submitting = true;
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const details = this.getSubmissionDetails();
    const data: BaseAssesmentResult = {
      details: details,
      timeTaken: currentTime - this.startTime,
      dateCompleted: currentDate,
    };
    this.apiService.submitAssessmentResult(this.settings.id, data).subscribe({
      next: (result) => {
        this.submitting = false;
        if (result) {
          this.result = result;
          this.successDialog?.nativeElement.show();
        }
      },
      error: () => {
        this.submitting = false;
        alert('An error has occurred while submitting the assessment. Please try again.');
      }
    });
  }

  closeSuccessDialog() {
    this.successDialog?.nativeElement.hide();
  }

  afterSuccessDialogClose() {
    if (this.result) {
      this.router.navigate(['/results', this.result.id], { state: { result: { ...this.result } } });
      this.result = undefined;
    }
  }

  setActiveQuestion(index: number) {
    index = index || 0;
    const question = this.questions[index];
    if (question.multiSelect === undefined) {
      let correctOptions = 0;
      for (const option of question.options) {
        if (option.correct) {
          correctOptions++;
        }
      }
      question.multiSelect = correctOptions > 1;
    }
    this.activeQuestionIndex = index;
    this.activeQuestion = question as PCheckboxQuestion | PRadioQuestion;
    this.image$.next({
      current: question.imageId || '',
      upcoming: this.questions[index + 1]?.imageId || '',
    });
  }

  handleAnswerInput(e: Event) {
    if (this.activeQuestion) {
      const { value, checked } = e.target as HTMLInputElement;

      if (this.activeQuestion.multiSelect === true) {
        if (!this.activeQuestion.selectedAnswer) {
          this.activeQuestion.selectedAnswer = new Set();
        }
        if (checked) {
          this.activeQuestion.selectedAnswer.add(value);
        } else {
          this.activeQuestion.selectedAnswer.delete(value);
        }
      } else {
        this.activeQuestion.selectedAnswer = new Set([value]);
      }
    }
  }

  handleClickNext() {
    const index =
      this.activeQuestionIndex < this.questions.length - 1 ? this.activeQuestionIndex + 1 : this.questions.length - 1;
    this.questions[this.activeQuestionIndex] = this.activeQuestion!;
    this.setActiveQuestion(index);
  }

  handleClickPrev() {
    const index = this.activeQuestionIndex > 0 ? this.activeQuestionIndex - 1 : 0;
    this.questions[this.activeQuestionIndex] = this.activeQuestion!;
    this.setActiveQuestion(index);
  }

  handleClickSubmit() {
    const { finished, unfinishedIndex } = this.checkIfFinished();
    if (!finished) {
      if (unfinishedIndex > -1) {
        this.setActiveQuestion(unfinishedIndex);
      }
      alert('You have not finished answering all questions.');
      return;
    }
    if (!confirm('WARNING: this will submit your quiz. Are you sure you want to do that?')) {
      return;
    }
    this.handleClickNext();
    this.submitAssessment();
  }

  handleAbandon() {
    if (
      !confirm(
        'WARNING: if you abandon now, quiz progress will not be saved and you will have to take it again. Are you sure you want to do that?'
      )
    ) {
      return;
    }
    this.router.navigate(['/quizzes', this.settings?.quiz.id]);
  }
}
