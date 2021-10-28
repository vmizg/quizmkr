import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BaseAssesmentResult,
  AssessmentResult,
  BaseAssessmentSettings,
  AssessmentSettings,
  Quiz,
  QuizQuestion,
  QuizQuestions,
} from '../models/quiz';
import { generateId } from '../utilities';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getQuizzes(params = '') {
    return this.http.get(`/api/quizzes${params}`).pipe(
      map((result) => result as Quiz[]),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return of([]);
        }
        throw err;
      })
    );
  }

  createQuiz(quiz: Omit<Quiz, 'id'>) {
    const id = generateId();
    const data: Quiz = { ...quiz, id };
    return this.http.post('/api/quizzes', data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  getQuiz(id: string) {
    return this.http.get(`/api/quizzes/${id}`).pipe(map((result) => result as Quiz));
  }

  updateQuiz(id: string, data: any) {
    return this.http.patch(`/api/quizzes/${id}`, data).pipe(map((result) => result as Quiz));
  }

  deleteQuiz(id: string) {
    return this.http.delete(`/api/quizzes/${id}`).pipe(map(() => true));
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

  createQuestions(quizId: string, questions: QuizQuestion[]) {
    const id = generateId();
    const data: QuizQuestions = { id, quizId, questions };
    return this.http.post(`/api/quizzes/${quizId}/questions`, data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  updateQuestions(id: string, questions: QuizQuestion[]) {
    // TODO: remove id constraint once backend is available
    return this.http.patch(`/api/questions/${id}`, { questions }).pipe(map((result) => result as QuizQuestions));
  }

  replaceQuestions(id: string, quizId: string, questions: QuizQuestion[]) {
    // TODO: replace with proper "delete" call when backend is available
    return this.http.put(`/api/questions/${id}`, { id, quizId, questions }).pipe(map(() => true));
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

  getAssessments(params = '') {
    return this.http.get(`/api/assessments${params}`).pipe(map((result) => result as AssessmentSettings[]));
  }

  getAssessment(id: string) {
    return this.http.get(`/api/assessments/${id}`).pipe(map((result) => result as AssessmentSettings));
  }

  updateAssessment(id: string, settings: any) {
    return this.http.patch(`/api/assessments/${id}`, settings).pipe(map((result) => result as AssessmentSettings));
  }

  submitResult(assessmentId: string, quizId: string, quizTitle: string, result: BaseAssesmentResult) {
    const id = generateId();
    const data: AssessmentResult = { ...result, assessmentId, quizId, quizTitle, id };
    return this.http.post(`/api/results`, data).pipe(
      map(() => data),
      catchError(() => of(null))
    );
  }

  getResults(params = '') {
    return this.http.get(`/api/results${params}`).pipe(map((result) => result as AssessmentResult[]));
  }

  getResult(id: string) {
    return this.http.get(`/api/results/${id}`).pipe(map((result) => result as AssessmentResult));
  }

  deleteResult(id: string) {
    return this.http.delete(`/api/results/${id}`).pipe(map(() => {}));
  }
}
