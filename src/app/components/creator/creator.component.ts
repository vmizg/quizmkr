import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { generateId } from 'src/app/utilities';

@Component({
  selector: 'app-creator',
  templateUrl: './creator.component.html',
  styleUrls: ['./creator.component.scss']
})
export class CreatorComponent implements OnInit {
  @ViewChild('tagInput') tagInputRef!: ElementRef<HTMLElement>;

  title = '';
  desc = '';
  tags: Set<string> = new Set();
  tag = '';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void { }

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
      this.tags.add(tag);
    }
    this.tag = '';
  }

  handleClearTags() {
    if (confirm('Are you sure you want to clear all tags?')) {
      this.tags = new Set();
      this.tag = '';
    }
  }

  handleRemoveTag(_tag: string) {
    this.tags.delete(_tag);
  }

  handleReset() {
    if (confirm('Are you sure you want to reset your changes?')) {
      this.title = '';
      this.desc = '';
      this.tags = new Set();
      this.tag = '';
    }
  }

  handleSubmit() {
    this.apiService.createQuiz({
      title: this.title,
      description: this.desc,
      tags: Array.from(this.tags),
    }).subscribe(() => {
      console.log('yay');
    }, (err) => {
      console.log(err);
    });
  }
}
