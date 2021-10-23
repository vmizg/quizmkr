import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { BaseQuiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-creator',
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.scss']
})
export class CreatorComponent implements OnInit, OnDestroy {
  @ViewChild('tagInput') tagInputRef!: ElementRef<HTMLElement>;

  $paramsSubscription?: Subscription;

  id = '';
  title = '';
  desc = '';
  tags: string[] = [];
  tag = '';

  isExisting = false;
  submitting = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.$paramsSubscription = this.route.params.pipe(
      concatMap((params) => {
        if (params.id) {
          return this.apiService.getQuiz(params.id);
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
      })
    ).subscribe();
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.$paramsSubscription?.unsubscribe();
  }

  handleTitleInput(e: Event) {
    this.title = (e.target as HTMLInputElement).value;
  }

  handleDescInput(e: Event) {
    this.desc = (e.target as HTMLTextAreaElement).value;
  }

  handleTagInput(e: Event) {
    this.tag = (e.target as HTMLInputElement).value;
  }

  handleAddTags() {
    const tags = this.tag.trim().split(',').filter((tag) => !!tag).map((tag) => tag.trim());
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
    const quiz: Omit<BaseQuiz, 'id'> = {
      title: this.title,
      description: this.desc,
      tags: this.tags,
    };
    let fn: Observable<BaseQuiz | null>;
    if (this.isExisting) {
      fn = this.apiService.updateQuiz(this.id, quiz);
    } else {
      fn = this.apiService.createQuiz(quiz);
    }
    fn.subscribe((result) => {
      this.submitting = false;
      this.isExisting = false;
      if (result) {
        this.router.navigate(['/quizzes']);
      }
    });
  }
}
