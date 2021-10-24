import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseAssessmentSettings, AssessmentSettings, BaseQuiz, QuizQ, QuizQuestions } from '../models/quiz';
import { generateId } from '../utilities';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  createQuiz(quiz: Omit<BaseQuiz, 'id'>) {
    const id = generateId();
    const data: BaseQuiz = { ...quiz, id };
    return this.http.post('/api/quizzes', data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }
  
  createQuestions(quizId: string, questions: QuizQ[]) {
    const id = generateId();
    const data: QuizQuestions = { id, quizId, questions };
    return this.http.post(`/api/quizzes/${quizId}/questions`, data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  getQuizzes(params = '') {
    return this.http.get(`/api/quizzes${params}`).pipe(
      map((result) => result as BaseQuiz[]),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return of([]);
        }
        throw err;
      })
    );
  }

  getQuiz(id: string) {
    return this.http.get(`/api/quizzes/${id}`).pipe(
      map((result) => result as BaseQuiz)
    );
  }

  getQuestions(quizId: string) {
    return this.http.get(`/api/quizzes/${quizId}/questions`).pipe(
      map((result: any) => {
        if (result && result[0]) {
          return result[0] as QuizQuestions;
        }
        return null;
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return of(null);
        }
        throw err;
      })
    );
  }

  updateQuiz(id: string, data: any) {
    return this.http.patch(`/api/quizzes/${id}`, data).pipe(
      map((result) => result as BaseQuiz)
    );
  }

  updateQuestions(id: string, questions: QuizQ[]) {
    // TODO: remove id constraint once backend is available
    return this.http.patch(`/api/questions/${id}`, { questions }).pipe(
      map((result) => result as QuizQuestions),
    );
  }

  replaceQuestions(id: string, quizId: string, questions: QuizQ[]) {
    // TODO: replace with proper "delete" call when backend is available
    return this.http.put(`/api/questions/${id}`, { id, quizId, questions }).pipe(
      map(() => true),
    );
  }

  deleteQuiz(id: string) {
    return this.http.delete(`/api/quizzes/${id}`).pipe(
      map(() => true)
    );
  }

  createAssessment(quizId: string, quizTitle: string, settings: BaseAssessmentSettings) {
    const id = generateId();
    // TODO: use url like /api/quizzes/{quizId}/assessments
    const data: AssessmentSettings = { ...settings, quizId, quizTitle, id };
    return this.http.post(`/api/assessments`, data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  getAssessments() {
    return this.http.get(`/api/assessments`).pipe(
      map((result) => result as AssessmentSettings[])
    );
  }
}
