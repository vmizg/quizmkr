import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of, interval, Subject, EMPTY, ReplaySubject } from 'rxjs';
import { catchError, concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { Assessment, BaseAssesmentResult, Question } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { areSetsEqual } from 'src/app/utilities';

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

@Component({
  selector: 'app-running-assessment',
  templateUrl: './running.component.html',
  styleUrls: ['./running.component.scss'],
})
export class RunningAssessmentComponent implements OnInit, OnDestroy {
  private paramsSubscription$?: Subscription;
  private stateSubscription$?: Subscription;
  private interval$?: Subscription;
  private image$ = new ReplaySubject<{ current: string; upcoming: string }>();
  private upcomingImage$ = new ReplaySubject<string>();
  private timeLimit$ = new Subject();

  alphabet = 'ABCDEFGHIJKLMNO';
  dataState?: AssessmentRouteState;
  settings?: Assessment;
  questions: PQuestion[] = [];
  activeQuestion?: PRadioQuestion | PCheckboxQuestion;
  activeQuestionIndex = 0;
  startTime: number = 0;
  timeLeft?: Date;
  dateFmt = 'mm:ss';

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
    this.paramsSubscription$ = this.route.params
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
        })
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
    this.paramsSubscription$?.unsubscribe();
    this.stateSubscription$?.unsubscribe();
    this.interval$?.unsubscribe();

    this.image$.next({ current: '', upcoming: '' });
    this.image$.complete();

    this.upcomingImage$.next('');
    this.upcomingImage$.complete();
  }

  private checkIfFinished() {
    let finished = true;
    let unfinishedIndex = -1;
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

  private calculateScore() {
    const details = this.questions.map((q) => {
      const correctAnswer = new Set<string>();
      for (const option of q.options) {
        if (option.correct) {
          correctAnswer.add(option.id);
        }
      }
      const answeredCorrectly = areSetsEqual(q.selectedAnswer, correctAnswer);
      return {
        questionId: q.id,
        selectedAnswer: q.selectedAnswer,
        correctAnswer,
        answeredCorrectly,
      };
    });
    const correctAnswers = details.filter(({ answeredCorrectly }) => answeredCorrectly);
    const score = Math.floor((correctAnswers.length / details.length) * 100);
    return {
      details: details.map((value) => {
        return {
          ...value,
          selectedAnswer: Array.from(value.selectedAnswer || []),
          correctAnswer: Array.from(value.correctAnswer),
        };
      }),
      score,
    };
  }

  private setTimeLeft(timeLimit: number) {
    const currentDate = new Date().getTime();
    this.timeLeft = new Date(timeLimit * 60 * 1000 + 1000 + this.startTime - currentDate);
  }

  private setupTimer(timeLimit?: number) {
    if (!timeLimit) {
      return;
    }
    this.dateFmt = timeLimit > 60 ? 'h:mm:ss' : 'mm:ss';
    this.setTimeLeft(timeLimit);
    this.interval$ = interval(1000)
      .pipe(
        takeUntil(this.timeLimit$),
        tap(() => {
          this.setTimeLeft(timeLimit);
          if (this.timeLeft && this.timeLeft.getTime() <= 0) {
            this.timeLimit$.next('');
            this.timeLimit$.complete();
          }
        })
      )
      .subscribe(
        () => {},
        () => {},
        () => {
          alert('TIME IS UP! Your quiz will now be submitted');
          this.submitAssessment();
        }
      );
  }

  private submitAssessment() {
    if (!this.settings) {
      // Sanity check, should never execute
      return;
    }
    this.submitting = true;
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const { score, details } = this.calculateScore();
    const data: BaseAssesmentResult = {
      score: score,
      details: details,
      timeTaken: currentTime - this.startTime,
      dateCompleted: currentDate,
    };
    this.apiService.submitAssessmentResult(this.settings.id, data).subscribe(
      (result) => {
        this.submitting = false;
        if (result) {
          alert(
            'You have successfully submitted the quiz! You will now be redirected to the home page where you can see your results.'
          );
          this.router.navigate(['/results', result.id], { state: { result } });
        }
      },
      () => {
        this.submitting = false;
        alert('An error has occurred while submitting the assessment. Please try again.');
      }
    );
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
      const inputEl = e.target as HTMLInputElement;
      const value = inputEl.value;

      if (this.activeQuestion.multiSelect === true) {
        if (!this.activeQuestion.selectedAnswer) {
          this.activeQuestion.selectedAnswer = new Set();
        }
        const selected = inputEl.checked;
        if (selected) {
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
