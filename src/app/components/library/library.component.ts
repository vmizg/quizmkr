import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SlDialog } from '@shoelace-style/shoelace';
import { concatMap, tap, take } from 'rxjs/operators';
import { Quiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent implements OnInit {
  @ViewChild('shareDialog')
  shareDialog?: ElementRef<SlDialog>;

  @ViewChild('deleteDialog')
  deleteDialog?: ElementRef<SlDialog>;

  itemToShare?: Quiz;
  shareValue = '';

  itemToDelete?: Quiz;

  library: Quiz[] = [];
  loading = true;

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getQuizzes().subscribe({
      next: (library) => {
        this.library = library;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  handleUserKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.addSharedWith();
    }
  }

  handleUserInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    if (value.includes(',')) {
      this.addSharedWith();
    } else {
      this.shareValue = value;
    }
  }

  handleUserRemove(user: string) {
    if (!this.itemToShare?.sharedWith) {
      return;
    }
    this.itemToShare.sharedWith = this.itemToShare.sharedWith.filter((value) => value !== user);
  }

  addSharedWith() {
    if (!this.shareValue || !this.itemToShare) {
      return;
    }
    const sharedWith = [...(this.itemToShare.sharedWith || [])];
    const tags = this.shareValue
      .trim()
      .split(',')
      .filter((tag) => !!tag)
      .map((tag) => tag.trim());
    for (const tag of tags) {
      if (!sharedWith.includes(tag)) {
        sharedWith.push(tag);
      }
    }
    this.itemToShare.sharedWith = sharedWith;
    this.shareValue = '';
  }

  handleEditSharing(collection: Quiz): void {
    this.itemToShare = collection;
    this.shareDialog?.nativeElement.show();
  }

  handleEditQuestions(collection: Quiz): void {
    this.router.navigate(['/creator', collection.id, 'questions']);
  }

  handleRequestDelete(collection: Quiz): void {
    this.itemToDelete = collection;
    this.deleteDialog?.nativeElement.show();
  }

  handleShare(): void {
    if (!this.itemToShare) {
      return;
    }
    this.loading = true;
    this.apiService
      .updateQuiz(this.itemToShare.id, { sharedWith: this.itemToShare.sharedWith })
      .pipe(
        concatMap(() => this.apiService.getQuizzes()),
        tap((library) => {
          this.library = library;
          this.loading = false;
        }),
        take(1),
      )
      .subscribe();
    this.shareDialog?.nativeElement.hide();
  }

  handleDelete(): void {
    if (!this.itemToDelete) {
      return;
    }
    this.loading = true;
    this.apiService
      .deleteQuiz(this.itemToDelete.id)
      .pipe(
        concatMap(() => this.apiService.getQuizzes()),
        tap((library) => {
          this.library = library;
          this.loading = false;
        }),
        take(1),
      )
      .subscribe();
    this.deleteDialog?.nativeElement.hide();
  }

  handleBeginAssessment(collection: Quiz): void {
    this.router.navigate(['/library', collection.id]);
  }

  closeDialog(dialog: HTMLElement) {
    (dialog as SlDialog).hide();
  }
}
