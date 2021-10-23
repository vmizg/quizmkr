import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseQuiz } from '../models/quiz';
import { generateId } from '../utilities';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  createQuiz(quiz: Omit<BaseQuiz, 'id'>) {
    const id = `q-${generateId()}`;
    const data: BaseQuiz = { ...quiz, id };
    return this.http.post('/api/quizzes', data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  getQuizzes() {
    return this.http.get('/api/quizzes').pipe(
      map((result) => result as BaseQuiz[])
    );
  }

  getQuiz(id: string) {
    return this.http.get(`/api/quizzes/${id}`).pipe(
      map((result) => result as BaseQuiz)
    );
  }

  deleteQuiz(id: string) {
    return this.http.delete(`/api/quizzes/${id}`).pipe(
      map(() => {})
    );
  }
}
