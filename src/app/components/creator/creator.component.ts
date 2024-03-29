import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, combineLatest, Subject } from 'rxjs';
import { concatMap, map, takeUntil } from 'rxjs/operators';
import { BaseQuiz, Quiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-creator',
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.scss'],
})
export class CreatorComponent implements OnInit, OnDestroy {
  @ViewChild('tagInput') tagInputRef!: ElementRef<HTMLElement>;

  id = '';
  title = '';
  desc = '';
  tags: string[] = [];
  tag = '';

  isExisting = false;
  submitting = false;
  redirectTo = 'questions';

  private destroyed$ = new Subject<void>();

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        concatMap(([params, queryParams]) => {
          if (params.qid) {
            if (queryParams.prev === 'library') {
              this.redirectTo = queryParams.prev;
            }
            return this.apiService.getQuiz(params.qid);
          }
          return EMPTY;
        }),
        map((quiz) => {
          if (quiz) {
            this.id = quiz.id;
            this.title = quiz.title;
            this.desc = quiz.description || '';
            this.tags = quiz.tags || [];
            this.isExisting = true;
          }
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  handleTitleInput(e: Event) {
    this.title = (e.target as HTMLInputElement).value;
  }

  handleDescInput(e: Event) {
    this.desc = (e.target as HTMLTextAreaElement).value;
  }

  handleTagKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.handleAddTags();
    }
  }

  handleTagInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    if (value.includes(',')) {
      this.handleAddTags();
    } else {
      this.tag = value;
    }
  }

  handleAddTags() {
    const tags = this.tag
      .trim()
      .split(',')
      .filter((tag) => !!tag)
      .map((tag) => tag.trim());
    for (const tag of tags) {
      this.tags.push(tag);
    }
    this.tag = '';
  }

  handleClearTags() {
    if (confirm('Are you sure you want to clear all tags?')) {
      this.tags = [];
      this.tag = '';
    }
  }

  handleRemoveTag(_tag: string) {
    const index = this.tags.indexOf(_tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  handleReset() {
    if (confirm('Are you sure you want to reset your changes?')) {
      this.title = '';
      this.desc = '';
      this.tags = [];
      this.tag = '';
    }
  }

  handleSubmit() {
    if (!this.title) {
      // TODO: validation
      return;
    }
    this.submitting = true;
    const quiz: BaseQuiz = {
      title: this.title,
      description: this.desc,
      tags: this.tags,
    };
    let fn: Observable<Quiz | null>;
    if (this.isExisting) {
      fn = this.apiService.updateQuiz(this.id, quiz);
    } else {
      fn = this.apiService.createQuiz(quiz);
    }
    fn.subscribe((result) => {
      this.submitting = false;
      this.isExisting = false;
      if (!result) {
        return;
      }
      switch (this.redirectTo) {
        case 'library':
          this.router.navigate(['/library']);
          break;
        default:
          this.router.navigate(['/creator', result.id, 'questions']);
          break;
      }
    });
  }
}
