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
import { forkJoin, Observable, EMPTY, ReplaySubject, of, Subject } from 'rxjs';
import { catchError, concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { BaseOption, BaseQuestion, Question } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';
import { ComponentCanDeactivate } from 'src/app/guards/pending-changes.guard';
import { generateColor, invertColor } from 'src/app/utilities';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
})
export class QuestionsComponent implements OnInit, OnDestroy, AfterViewInit, ComponentCanDeactivate {
  private image$ = new ReplaySubject<string>();
  private destroyed$ = new Subject<void>();

  @ViewChild('questionForm') questionForm!: ElementRef<HTMLFormElement>;
  @ViewChild('statementInput') statementInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChildren('questionOptions') questionOptions!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('answerNote') answerNote!: ElementRef<HTMLInputElement>;

  alphabet = 'ABCDEFGHIJKLMNO';
  questions: Question[] = [];
  quizId: string = '';
  quizTitle: string = '';
  quizColor: string = '';
  totalOptions = 3;
  cssVars = {};
  loading = true;
  edited = false;
  adding = false;

  questionIndex = 0;
  existingQuestion?: Question;
  existingQuestionToRender?: Question;

  image: string = '';
  imageLoading = false;
  imageCache: { [key: string]: string } = {};
  existingImageId: string = '';

  constructor(
    private cd: ChangeDetectorRef,
    private apiService: ApiService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loading = true;

    this.route.queryParams
      .pipe(
        tap((params) => {
          this.handleQueryParamChange(params);
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.route.params
      .pipe(
        concatMap((params) => {
          this.quizId = params.qid;
          return forkJoin([this.apiService.getQuiz(this.quizId), this.apiService.getQuestions(this.quizId)]);
        }),
        tap(([quiz, questions]) => {
          this.loading = false;
          if (quiz) {
            this.quizTitle = quiz.title;
            this.questions = questions || [];
            this.handleQueryParamChange(this.route.snapshot.queryParams);
          } else {
            this.router.navigate(['/creator']);
          }
        }),
        catchError(() => {
          this.loading = false;
          this.router.navigate(['/creator']);
          return EMPTY;
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();

    this.image$
      .pipe(
        concatMap((imageId) => {
          this.existingImageId = imageId || '';
          if (!imageId) {
            return of('');
          }
          const image = this.imageCache[imageId];
          if (image) {
            return of(image);
          }
          this.imageLoading = true;
          return this.apiService.getImage(imageId).pipe(
            map(({ image }) => {
              this.imageCache[imageId] = image;
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
    this.questionOptions.changes.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      if (this.existingQuestionToRender) {
        this.renderEditQuestion(this.existingQuestionToRender);
        this.existingQuestionToRender = undefined;
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();

    this.image$.next('');
    this.image$.complete();
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

  handleRemoveOption(optionInput: HTMLElement) {
    if (
      (optionInput as HTMLInputElement).value &&
      !confirm("The option you're trying to remove is non-empty. Do you want to continue?")
    ) {
      return;
    }
    this.totalOptions--;
    this.edited = true;
  }

  handleAddQuestion(e: Event) {
    const { formData }: { formData: FormData; formControls: HTMLInputElement[] } = (e as CustomEvent).detail;

    const title = (formData.get('title') as string).trim();
    if (!title) {
      alert('Please fill out the question statement field.');
      return;
    }
    const answerNote = (formData.get('answer-note') as string).trim();

    // No question ID means that we are creating a new question
    const questionId = this.existingQuestion ? this.existingQuestion.id : null;
    const question: BaseQuestion = {
      index: this.questions.length,
      title: title,
      options: [],
      ...(answerNote ? { answerNote } : {}),
      ...(!this.existingImageId && this.image ? { image: { image: this.image } } : {}),
    };
    const titleMap: any = {};
    let totalCorrect = 0;

    for (let i = 0; i < this.totalOptions; i++) {
      const option: BaseOption = {
        index: i,
        title: (formData.get(`option-${i}`) as string).trim(),
        correct: (formData.get(`correct-${i}`) as string) === 'on',
      };
      if (!option.title) {
        alert('Please fill out the empty option field(-s).');
        return;
      }
      // If question title is already prefixed with the letter, such as A., (A), 1., (1), remove it
      if (option.title.startsWith(`${i}. `) || option.title.startsWith(`${this.alphabet[i]}. `)) {
        option.title = option.title.substring(3).trim();
      } else if (option.title.startsWith(`(${i}) `) || option.title.startsWith(`(${this.alphabet[i]}) `)) {
        option.title = option.title.substring(4).trim();
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

    let $obs: Observable<Question | null>;
    if (!questionId) {
      $obs = this.apiService.createQuestion(this.quizId, question);
    } else {
      $obs = this.apiService.updateQuestion(questionId, question);
    }

    $obs.subscribe(
      (question) => {
        if (!question) {
          return;
        }
        let index = -1;
        const clonedQuestions = [...this.questions];
        if (questionId) {
          index = clonedQuestions.findIndex(({ id }) => id === questionId);
          if (index > -1) {
            clonedQuestions.splice(index, 1, question);
          }
        } else {
          clonedQuestions.push(question);
        }
        this.questions = clonedQuestions;
        this.handleCancelEdit();
      },
      (err) => {
        console.log(err);
      }
    );
  }

  private onEdit(question: Question): void {
    // const formControls = this.questionForm.nativeElement.getFormControls();
    // this.formService.resetForm(formControls);
    this.questionForm.nativeElement.reset();

    this.edited = false;
    this.image = '';

    const totalOptions = question.options.length;
    if (totalOptions !== this.totalOptions) {
      // Mark for change check (ngAfterViewInit) since we are changing the total amount of inputs
      this.existingQuestionToRender = question;
      this.totalOptions = totalOptions;
    } else {
      this.renderEditQuestion(question);
    }
    this.existingQuestion = question;
    this.questionIndex = this.questions.findIndex((q) => q.id === question.id);
  }

  handleEditQuestion(question: Question, target?: HTMLElement): void {
    if (this.isEditing(question)) {
      this.handleCancelEdit();
      return;
    }

    if (
      this.edited &&
      !confirm(
        'WARNING: you have a question that is currently being edited. By clicking confirm you will lose all changes in the current form.'
      )
    ) {
      return;
    }

    if (target) {
      // TODO: fix scrolling into component
      // target.scrollIntoView({ behavior: 'smooth' });
    }

    // Set query params to trigger queryParams observable and edit fn
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: question.id },
      queryParamsHandling: 'merge',
    });
  }

  renderEditQuestion(question: Question): void {
    let optionIndex = 0;
    let correctIndex = 0;

    this.statementInput.nativeElement.value = question.title;
    this.answerNote.nativeElement.value = question.answerNote || '';

    for (const item of this.questionOptions) {
      const element = item.nativeElement;
      const option = element.querySelector('.option-input') as HTMLInputElement;
      const toggle = element.querySelector('.correct-toggle') as HTMLInputElement;

      option.value = question.options[optionIndex].title;
      optionIndex++;

      toggle.checked = !!question.options[correctIndex].correct;
      correctIndex++;
    }

    if (question.imageId !== undefined) {
      this.image$.next(question.imageId);
    }
  }

  handleCancelEdit(): void {
    this.resetForm();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: undefined },
      queryParamsHandling: 'merge',
    });
  }

  handleDeleteQuestion(question: Question): void {
    if (confirm('WARNING: are you sure you would like to delete this question?')) {
      this.apiService.deleteQuestion(question.id).subscribe((result) => {
        if (result) {
          if (this.existingQuestion) {
            this.resetForm();
          }
          const clonedQuestions = [...this.questions];
          const index = clonedQuestions.indexOf(question);
          if (index > -1) {
            clonedQuestions.splice(index, 1);
          }
          this.questions = clonedQuestions;
          this.questionIndex = this.questions.length;
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
    if (file) {
      this.uploadImage(file).subscribe(() => (inputEl.value = ''));
    }
  }

  handlePaste(e: ClipboardEvent) {
    const data = e.clipboardData;
    if (data?.getData('text') || !data?.files) {
      return;
    }
    const [file] = Array.from(data.files || []);
    if (file && !this.image) {
      this.uploadImage(file).subscribe();
    }
  }

  isEditing(q: Question): boolean {
    return this.existingQuestion ? q.id === this.existingQuestion.id : false;
  }

  private handleQueryParamChange(params: any) {
    if (params.q) {
      const question = this.questions.find((q) => params.q === `${q.id}`);
      if (question) {
        this.onEdit(question);
      }
    } else {
      this.questionIndex = this.questions.length;
    }
  }

  private uploadImage(file: File) {
    return this.imageService.resizeImage(file).pipe(
      tap(({ dataUrl }) => {
        if (dataUrl) {
          this.image = dataUrl;
          this.existingImageId = '';
        } else {
          throw Error('Did not receive a dataUrl while resizing the image');
        }
      }),
      catchError((err) => {
        console.log(err);
        return EMPTY;
      })
    );
  }

  private updateColor(color: string) {
    this.quizColor = color;
    this.cssVars = {
      '--badge-bg-color': this.quizColor,
      '--badge-fg-color': invertColor(this.quizColor, true),
      '--badge-content': "'" + this.quizColor + "'",
    };
  }

  private resetForm() {
    this.questionForm.nativeElement.reset();

    this.totalOptions = 3;
    this.questionIndex = this.questions.length;
    this.existingQuestion = undefined;
    this.edited = false;
    this.image = '';
  }
}
