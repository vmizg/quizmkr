import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { concatMap, tap, take } from 'rxjs/operators';
import { BaseQuiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss']
})
export class QuizzesComponent implements OnInit {
  quizzes: BaseQuiz[] = [];
  loading = true;

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getQuizzes().subscribe((quizzes) => {
      this.quizzes = quizzes;
      this.loading = false;
    });
  }

  handleEditQuiz(quiz: BaseQuiz): void {
    this.router.navigate(['creator', quiz.id, 'questions']);
  }

  handleDeleteQuiz(quiz: BaseQuiz): void {
    if (confirm(`WARNING: this will delete the quiz ${quiz.title} permanently! Are you sure you want to do this?`)) {
      this.loading = true;
      this.apiService.deleteQuiz(quiz.id).pipe(
        concatMap(() => this.apiService.getQuizzes()),
        tap((quizzes) => {
          this.quizzes = quizzes;
          this.loading = false;
        }),
        take(1)
      ).subscribe();
    }
  }

  handleBeginAssessment(quiz: BaseQuiz): void {
    this.router.navigate(['quizzes', quiz.id]);
  }
}
