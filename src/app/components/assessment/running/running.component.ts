import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin, of, interval, Subject } from 'rxjs';
import { concatMap, takeUntil, tap } from 'rxjs/operators';
import { AssessmentSettings, BaseAssesmentResult, QuizQuestion } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { areSetsEqual, shuffleArray } from 'src/app/utilities';

interface PQuestion extends QuizQuestion {
  completed?: boolean;
  multiSelect?: boolean;
  selectedAnswer?: Set<number>;
}

interface PRadioQuestion extends PQuestion {
  multiSelect: false;
}

interface PCheckboxQuestion extends PQuestion {
  multiSelect: true;
}

interface AssessmentRouteState {
  settings: AssessmentSettings;
  questions: PQuestion[];
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
  private timeLimit$ = new Subject();

  alphabet = 'ABCDEFGHIJKLMNO';
  dataState?: AssessmentRouteState;
  settings: AssessmentSettings = {
    id: '',
    quizId: '',
    quizTitle: '',
    totalQuestions: 1,
    rangeFrom: 1,
    rangeTo: 1,
  };
  questions: PQuestion[] = [];
  activeQuestion?: PRadioQuestion | PCheckboxQuestion;
  activeQuestionIndex = 0;
  startTime: number = 0;
  timeLeft?: Date;
  dateFmt = 'mm:ss';

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
    this.dataState = this.router.getCurrentNavigation()?.extras.state as AssessmentRouteState;
  }

  ngOnInit(): void {
    this.paramsSubscription$ = this.route.params
      .pipe(
        concatMap((params) => {
          this.settings.id = params.aid;
          this.settings.quizId = params.qid;
          const { settings, questions } = this.dataState || {};
          return forkJoin([
            settings ? of(settings) : this.apiService.getAssessment(this.settings.id),
            questions ? of({ questions }) : this.apiService.getQuestions(this.settings.quizId),
          ]);
        }),
        tap(([assessment, questions]: any) => {
          this.settings = assessment as AssessmentSettings;
          let _questions = questions?.questions as QuizQuestion[] || [];
          if (_questions.length === 0 || this.settings.finished) {
            this.router.navigate(['/quizzes', this.settings.quizId]);
            return;
          }
          if (this.settings.order) {
            // Recreate the randomized order
            _questions = this.settings.order.map((index) => ({ ..._questions[index], index }));
          } else {
            // Use sequential order, but include index in case the API did not return
            _questions = _questions.map((q, index) => ({ ...q, index }));
          }
          this.questions = _questions;
          this.setActiveQuestion(0);
          this.startTime = new Date().getTime();
          this.setupTimer();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
    this.stateSubscription$?.unsubscribe();
    this.interval$?.unsubscribe();
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
      const correctAnswer = new Set<number>();
      for (let i = 0; i < q.options.length; i++) {
        if (q.options[i].correct) {
          correctAnswer.add(i);
        }
      }
      const answeredCorrectly = areSetsEqual(q.selectedAnswer, correctAnswer);
      return {
        questionId: q.id,
        questionIndex: q.index,
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

  private setupTimer() {
    const timeLimit = this.settings.timeLimit;
    if (timeLimit) {
      this.dateFmt = timeLimit > 60 ? 'h:mm:ss' : 'mm:ss';
      this.setTimeLeft(timeLimit);
      this.interval$ = interval(1000)
        .pipe(
          takeUntil(this.timeLimit$),
          tap(() => {
            this.setTimeLeft(timeLimit);
            if (this.timeLeft && this.timeLeft.getTime() <= 0) {
              this.timeLimit$.next();
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
  }

  private submitAssessment() {
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const { score, details } = this.calculateScore();
    const data: BaseAssesmentResult = {
      score: score,
      details: details,
      timeTaken: currentTime - this.startTime,
      dateCompleted: currentDate,
    };
    forkJoin([
      this.apiService.submitResult(this.settings.id, this.settings.quizId, this.settings.quizTitle, data),
      this.apiService.updateAssessment(this.settings.id, { finished: true }),
    ]).subscribe(([results, assessment]) => {
      if (results && assessment) {
        alert(
          'You have successfully submitted the quiz! You will now be redirected to the home page where you can see your results.'
        );
        this.router.navigate(['/results', results.id], { state: { results } });
      }
    });
  }

  setActiveQuestion(index: number) {
    const question = this.questions[index || 0];
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
  }

  handleAnswerInput(e: Event, index = 0) {
    if (this.activeQuestion) {
      if (!this.activeQuestion.selectedAnswer) {
        this.activeQuestion.selectedAnswer = new Set();
      }
      if (this.activeQuestion.multiSelect === true) {
        const selected = (e.target as HTMLInputElement).checked;
        if (selected) {
          this.activeQuestion.selectedAnswer.add(index);
        } else {
          this.activeQuestion.selectedAnswer.delete(index);
        }
      } else {
        const value = (e.target as HTMLInputElement).value;
        this.activeQuestion.selectedAnswer = new Set([Number(value)]);
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
    this.router.navigate(['/quizzes']);
  }
}
