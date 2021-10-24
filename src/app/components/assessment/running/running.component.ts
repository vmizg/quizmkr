import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { AssessmentSettings, BaseAssesmentResult, QuizQ } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { getRandomInteger } from 'src/app/utilities';

interface PQuestion extends QuizQ {
  completed?: boolean;
  multiSelect?: boolean;
  selectedAnswerIndex?: number | boolean[];
}

interface PRadioQuestion extends PQuestion {
  multiSelect: false;
  selectedAnswerIndex: number;
}

interface PCheckboxQuestion extends PQuestion {
  multiSelect: true;
  selectedAnswerIndex: boolean[];
}

@Component({
  selector: 'app-running-assessment',
  templateUrl: './running.component.html',
  styleUrls: ['./running.component.scss'],
})
export class RunningAssessmentComponent implements OnInit, OnDestroy {
  private paramsSubscription$?: Subscription;
  private stateSubscription$?: Subscription;

  alphabet = 'ABCDEFGHIJKLMNO';
  settings: AssessmentSettings = {
    id: '',
    quizId: '',
    quizTitle: '',
    totalQuestions: 1,
    rangeFrom: 1,
    rangeTo: 1,
    randomize: false,
    finished: false,
  };
  questions: PQuestion[] = [];
  activeQuestion?: PRadioQuestion | PCheckboxQuestion;
  activeQuestionIndex = 0;
  startTime: number = 0;

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.paramsSubscription$ = this.route.params
      .pipe(
        concatMap((params) => {
          this.settings.id = params.aid;
          this.settings.quizId = params.qid;
          return forkJoin([
            this.apiService.getAssessment(this.settings.id),
            this.apiService.getQuestions(this.settings.quizId),
          ]);
        }),
        tap(([assessment, questions]) => {
          this.settings = assessment;
          this.questions = questions?.questions || [];
          if (this.questions.length === 0 || this.settings.finished) {
            this.router.navigate(['/quizzes', this.settings.quizId]);
            return;
          }
          this.prepareQuestions();
          this.setActiveQuestion(0);
          this.startTime = new Date().getTime();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
    this.stateSubscription$?.unsubscribe();
  }

  private prepareQuestions() {
    const totalQuestions = this.settings.totalQuestions || this.questions.length;
    const rangeFrom = (this.settings.rangeFrom || 1) - 1; // 0-indexed
    const rangeTo = (this.settings.rangeTo || this.questions.length);
    this.questions = this.questions.slice(rangeFrom, rangeTo);
    if (!this.settings.randomize) {
      this.questions = this.questions.slice(0, totalQuestions - 1);
    } else {
      // This can happen in the case where a smaller range was defined than the total questions asked
      const total = this.questions.length < totalQuestions ? this.questions.length : totalQuestions;
      const questions = [];
      const indexes: { [key: string]: boolean } = {};
      while (questions.length < total) {
        let index = getRandomInteger(0, total - 1);
        if (indexes[index]) {
          continue;
        }
        questions.push(this.questions[index]);
        indexes[index] = true;
      }
      this.questions = questions;
    }
  }

  private checkIfFinished() {
    let finished = true;
    let unfinishedIndex = -1;
    for (let i = 0; i < this.questions.length; i++) {
      let answered = false;
      if (this.questions[i].multiSelect) {
        const q = this.questions[i] as PCheckboxQuestion;
        if (q.selectedAnswerIndex) {
          for (const answer of q.selectedAnswerIndex) {
            answered = answered || answer;
          }
        }
      } else {
        const q = this.questions[i] as PRadioQuestion;
        answered = q.selectedAnswerIndex > -1 && q.selectedAnswerIndex < q.options.length;
      }
      if (!answered) {
        finished = false;
        unfinishedIndex = i;
        break;
      }
    }
    return { finished, unfinishedIndex };
  }

  private calculateScore() {
    const details = this.questions.map((item) => {
      let answeredCorrectly = true;
      if (item.multiSelect) {
        let q = item as PCheckboxQuestion;
        for (let i = 0; i < q.options.length; i++) {
          answeredCorrectly =
            (answeredCorrectly && q.options[i].correct && q.selectedAnswerIndex[i]) ||
            (!q.options[i].correct && !q.selectedAnswerIndex[i]);
        }
      } else {
        let q = item as PRadioQuestion;
        answeredCorrectly = !!q.options[q.selectedAnswerIndex].correct;
      }
      return { questionId: item.id, answeredCorrectly };
    });
    const correctAnswers = details.filter(({ answeredCorrectly }) => answeredCorrectly);
    const score = Math.floor((correctAnswers.length / details.length) * 100);
    return { details, score };
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
      if (this.activeQuestion.multiSelect === true) {
        if (!this.activeQuestion.selectedAnswerIndex) {
          this.activeQuestion.selectedAnswerIndex = [false, false, false];
        }
        const selected = (e.target as HTMLInputElement).checked;
        if (this.activeQuestion) {
          this.activeQuestion.selectedAnswerIndex[index] = selected;
        }
      } else {
        const value = (e.target as HTMLInputElement).value;
        this.activeQuestion.selectedAnswerIndex = Number(value);
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
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const { score, details } = this.calculateScore();
    const data: BaseAssesmentResult = {
      score: score,
      details: details,
      timeTaken: currentTime - this.startTime,
      dateCompleted: currentDate,
    };
    console.log('DONE', this.questions, data);
    forkJoin([
      this.apiService.submitResult(this.settings.id, this.settings.quizId, this.settings.quizTitle, data),
      this.apiService.updateAssessment(this.settings.id, { finished: true }),
    ]).subscribe(([result1, result2]) => {
      if (result1 && result2) {
        alert(
          'You have successfully submitted the quiz! You will now be redirected to the home page where you can see your results.'
        );
        this.router.navigate(['/home'], { queryParams: { assessment: this.settings.id } });
      }
    });
  }
}
