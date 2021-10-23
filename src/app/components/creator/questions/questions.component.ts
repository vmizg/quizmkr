import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { QOption, QuizQ } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { ComponentCanDeactivate } from 'src/app/guards/pending-changes.guard';
import { generateColor, invertColor } from 'src/app/utilities';

const getNewQuestion = () => {
  return {
    title: '',
    options: new Set([
      { title: '', correct: true },
      { title: '', correct: false },
      { title: '', correct: false },
    ])
  };
};

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  $paramsSubscription: Subscription;
  questions: Set<QuizQ> = new Set();
  question: QuizQ = getNewQuestion();
  quizId: string = '';
  quizTitle: string = '';
  quizColor: string = generateColor();
  edited = false;
  adding = false;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    this.$paramsSubscription = this.route.params.pipe(
      concatMap((params) => {
        this.quizId = params.id;
        return this.apiService.getQuiz(params.id);
      }),
      tap((quiz) => {
        this.quizTitle = quiz.title;
      })
    ).subscribe();
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !this.edited;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.$paramsSubscription.unsubscribe();
  }

  invertColor(color: string) {
    return invertColor(color, true);
  }

  handleColorChange(e: Event) {
    this.quizColor = (e.target as HTMLInputElement).value;
  }

  handleTitleInput(e: Event) {
    this.question.title = (e.target as HTMLInputElement).value;
    this.edited = true;
  }

  handleOptionTitleInput(e: Event, option: QOption) {
    option.title = (e.target as HTMLInputElement).value;
    this.edited = true;
  }

  handleCorrectToggle(option: QOption) {
    option.correct = !option.correct;
    this.edited = true;
  }

  handleRemoveOption(option: QOption) {
    this.question.options.delete(option);
    this.edited = true;
  }

  handleAddQuestion() {
    this.questions.add(this.question);
    this.question = getNewQuestion();
    for (const entry of this.questions) {
      console.log(entry);
    }
  }
}
