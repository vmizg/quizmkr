import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, Subscription, EMPTY } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { QOption, QuizQ, QuizQuestions } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { ComponentCanDeactivate } from 'src/app/guards/pending-changes.guard';
import { generateColor, generateId, invertColor } from 'src/app/utilities';
import { ShoelaceFormService } from 'src/app/services/shoelace-form.service';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
})
export class QuestionsComponent implements OnInit, OnDestroy, AfterViewInit, ComponentCanDeactivate {
  private paramsSubscription$?: Subscription;
  private changesSubscription$?: Subscription;

  @ViewChild('questionForm') questionForm!: ElementRef<HTMLFormElement>;
  @ViewChildren('questionOptions') questionOptions!: QueryList<HTMLDivElement>;

  alphabet = 'ABCDEFGHIJKLMNO';
  questionsId?: string;
  questions: QuizQ[] = [];
  image: string = '';
  newQuiz = false;
  quizId: string = '';
  quizTitle: string = '';
  quizColor: string = '';
  totalOptions = 3;
  cssVars = {};
  loading = true;
  edited = false;
  adding = false;

  existingQuestion?: QuizQ;
  existingQuestionToRender?: QuizQ;

  constructor(
    private cd: ChangeDetectorRef,
    private apiService: ApiService,
    private imageService: ImageService,
    private formService: ShoelaceFormService,
    private route: ActivatedRoute,
    private router: Router
  ) {
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
            this.questionsId = questions?.id;
            this.questions = questions?.questions || [];
          } else {
            this.router.navigate(['/creator']);
          }
        }),
        catchError(() => {
          this.loading = false;
          this.router.navigate(['/creator']);
          return EMPTY;
        })
      )
      .subscribe();
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    return !this.edited;
  }

  ngOnInit(): void {
    this.updateColor(generateColor());
  }

  ngAfterViewInit(): void {
    this.changesSubscription$ = this.questionOptions.changes.subscribe(() => {
      if (this.existingQuestionToRender) {
        this.renderEditQuestion(this.existingQuestionToRender);
        this.existingQuestionToRender = undefined;
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSubscription$?.unsubscribe();
    this.changesSubscription$?.unsubscribe();
  }

  counter(i: number) {
    return new Array(i);
  }

  handleColorChange(e: Event) {
    this.updateColor((e.target as HTMLInputElement).value);
  }

  handleEditQuiz() {
    this.router.navigate(['/creator', this.quizId]);
  }

  handleEdit() {
    this.edited = true;
  }

  handleAddOption() {
    this.totalOptions++;
    this.edited = true;
  }

  handleRemoveOption() {
    this.totalOptions--;
    this.edited = true;
  }

  handleAddQuestion(e: Event) {
    const { formData, formControls }: { formData: FormData; formControls: HTMLInputElement[] } = (e as CustomEvent)
      .detail;

    const title = (formData.get('title') as string).trim();
    if (!title) {
      alert('Please fill out the question statement field.');
      return;
    }
    const answerNote = (formData.get('answer-note') as string).trim();

    const question: QuizQ = {
      id: generateId(),
      title: title,
      options: [],
      ...(answerNote ? { answerNote } : {}),
      ...(this.image ? { imageURI: this.image } : {}),
    };
    const titleMap: any = {};
    let totalCorrect = 0;

    for (let i = 0; i < this.totalOptions; i++) {
      const option: QOption = {
        title: (formData.get(`option-${i}`) as string).trim(),
        correct: (formData.get(`correct-${i}`) as string) === 'on',
      };
      if (!option.title) {
        alert('Please fill out the empty option field(-s).');
        return;
      }
      if (titleMap[option.title]) {
        alert('One or more options are duplicated.');
        return;
      }
      titleMap[option.title] = true;
      if (option.correct) {
        totalCorrect++;
      }
      question.options.push(option);
    }

    if (totalCorrect === question.options.length) {
      alert('At least one option must be marked as incorrect.');
      return;
    } else if (totalCorrect === 0) {
      alert('At least one option must be marked as correct.');
      return;
    }

    let index = -1;
    const clonedQuestions = [...this.questions];
    if (this.existingQuestion) {
      index = clonedQuestions.indexOf(this.existingQuestion);
    }
    if (index > -1) {
      clonedQuestions.splice(index, 1, question);
    } else {
      clonedQuestions.push(question);
    }
    let $obs: Observable<QuizQuestions | null>;
    if (!this.questionsId) {
      // No questions ID means that no questions have been created yet
      $obs = this.apiService.createQuestions(this.quizId, clonedQuestions);
    } else {
      $obs = this.apiService.updateQuestions(this.questionsId, clonedQuestions);
    }
    $obs.subscribe(
      (result) => {
        if (result) {
          this.questionsId = result.id;
          this.questions = clonedQuestions;
          this.resetForm(formControls);
          this.newQuiz = false;
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  handleEditQuestion(question: QuizQ): void {
    const formControls = this.questionForm.nativeElement.getFormControls();
    if (this.edited) {
      if (
        confirm(
          'WARNING: you have a question that is currently being edited. By clicking confirm you will lose all changes in the current form.'
        )
      ) {
        this.formService.resetForm(formControls);
        this.edited = false;
      } else {
        return;
      }
    }

    const totalOptions = question.options.length;
    if (totalOptions !== this.totalOptions) {
      // Mark for change check (ngAfterViewInit) since we are changing the total amount of inputs
      this.existingQuestionToRender = question;
      this.totalOptions = totalOptions;
    } else {
      this.renderEditQuestion(question);
    }
    this.existingQuestion = question;
  }

  renderEditQuestion(question: QuizQ): void {
    const formControls = this.questionForm.nativeElement.getFormControls();

    let optionIndex = 0;
    let correctIndex = 0;

    for (const control of formControls) {
      if (!control.name) {
        continue;
      }
      if (control.name === 'title') {
        control.value = question.title;
      } else if (control.name.startsWith('option')) {
        control.value = question.options[optionIndex].title;
        optionIndex++;
      } else if (control.name.startsWith('correct')) {
        control.checked = !!question.options[correctIndex].correct;
        correctIndex++;
      } else if (control.name === 'answer-note') {
        control.value = question.answerNote;
      }
    }

    if (question.imageURI) {
      this.image = question.imageURI;
    }
  }

  handleDeleteQuestion(question: QuizQ): void {
    if (!this.questionsId) {
      // Sanity check - this should never execute
      return;
    }
    if (confirm('WARNING: are you sure you would like to delete this question?')) {
      const clonedQuestions = [...this.questions];
      const index = clonedQuestions.indexOf(question);
      if (index > -1) {
        clonedQuestions.splice(index, 1);
      }
      // TODO: replace with proper "delete" call when backend is available
      this.apiService.replaceQuestions(this.questionsId, this.quizId, clonedQuestions).subscribe((result) => {
        if (result) {
          if (this.existingQuestion) {
            this.resetForm();
          }
          this.questions = clonedQuestions;
        }
      });
    }
  }

  handleUploadImage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    if (!inputEl) {
      return;
    }
    const [file] = Array.from(inputEl.files || []);
    if (!file) {
      return;
    }
    this.imageService.resizeImage(file, { maxSize: 400 }).subscribe(
      ({ dataUrl }) => {
        this.image = dataUrl;
        inputEl.value = '';
      },
      (err) => {
        console.log(err);
        inputEl.value = '';
      }
    );
  }

  updateColor(color: string) {
    this.quizColor = color;
    this.cssVars = {
      '--badge-bg-color': this.quizColor,
      '--badge-fg-color': invertColor(this.quizColor, true),
      '--badge-content': "'" + this.quizColor + "'",
    };
  }

  resetForm(formControls?: HTMLInputElement[]) {
    const controls = formControls || this.questionForm.nativeElement.getFormControls();
    this.formService.resetForm(controls);
    this.totalOptions = 3;
    this.existingQuestion = undefined;
    this.edited = false;
    this.image = '';
  }
}
