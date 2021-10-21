import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseQuiz } from '../models/quiz';
import { generateId } from '../utilities';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  createQuiz(quiz: Omit<BaseQuiz, 'id'>): Observable<any> {
    const id = `q-${generateId()}`;
    return this.http.post('/api/quizzes', { ...quiz, id });
  }

  getQuizzes(): Observable<BaseQuiz[]> {
    return this.http.get('/api/quizzes') as Observable<BaseQuiz[]>;
  }
}
