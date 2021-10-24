import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { AssessmentSettings, QuizQ } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

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
  styleUrls: ['./running.component.scss']
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
  };
  questions: PQuestion[] = [];
  activeQuestion?: (PRadioQuestion | PCheckboxQuestion);
  activeQuestionIndex = 0;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.paramsSubscription$ = this.route.params.pipe(
      concatMap((params) => {
        this.settings.id = params.aid;
        this.settings.quizId = params.qid;
        return forkJoin([
          this.apiService.getAssessment(this.settings.id),
          this.apiService.getQuestions(this.settings.quizId)
        ]);
      }),
      tap(([assessment, questions]) => {
        this.settings = assessment;
        this.questions = questions?.questions || [];
        if (this.questions.length === 0) {
          this.router.navigate(['/quizzes', this.settings.quizId]);
          return;
        }
        this.setActiveQuestion(0);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
    this.stateSubscription$?.unsubscribe();
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
    this.activeQuestion = question as (PCheckboxQuestion | PRadioQuestion);
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
    const index = this.activeQuestionIndex < this.questions.length - 1 ? this.activeQuestionIndex + 1 : this.questions.length - 1;
    this.questions[this.activeQuestionIndex] = this.activeQuestion!;
    this.setActiveQuestion(index);
  }

  handleClickPrev() {
    const index = this.activeQuestionIndex > 0 ? this.activeQuestionIndex - 1 : 0;
    this.questions[this.activeQuestionIndex] = this.activeQuestion!;
    this.setActiveQuestion(index);
  }

  handleClickSubmit() {
    let finished = true;
    let unfinishedIndex = -1;
    for (let i = 0; i < this.questions.length; i++) {
      let answered = false;
      if (this.questions[i].multiSelect) {
        const q = this.questions[i] as PCheckboxQuestion;
        for (const answer of q.selectedAnswerIndex) {
          answered = answered || answer;
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
    if (!finished) {
      if (unfinishedIndex > -1) {
        this.activeQuestion = this.questions[unfinishedIndex] as (PCheckboxQuestion | PRadioQuestion);
      }
      alert('You have not finished answering all questions.');
      return;
    }
    this.handleClickNext();
    console.log('DONE', this.questions);
  }
}
