import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import {
  PartialQuiz,
  BaseQuiz,
  Quiz,
  PartialQuestion,
  BaseQuestion,
  Question,
  PartialAssessment,
  BaseAssessment,
  Assessment,
  BaseAssesmentResult,
  AssessmentResult,
} from '../models/quiz';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getQuizzes(params?: any) {
    return this.http
      .get(`/api/quizzes`, { params: this.constructParams(params) })
      .pipe(map((result) => result as Quiz[]));
  }

  getQuiz(id: string) {
    return this.http.get(`/api/quizzes/${id}`).pipe(map((result) => result as Quiz));
  }

  createQuiz(payload: BaseQuiz) {
    return this.http.post('/api/quizzes', payload).pipe(map((result) => result as Quiz));
  }

  updateQuiz(id: string, payload: PartialQuiz) {
    return this.http.patch(`/api/quizzes/${id}`, payload).pipe(map((result) => result as Quiz));
  }

  deleteQuiz(id: string) {
    return this.http.delete(`/api/quizzes/${id}`).pipe(map((result) => (result ? true : false)));
  }

  getQuestions(quizId: string) {
    return this.http.get(`/api/quizzes/${quizId}/questions`).pipe(map((result) => result as Question[]));
  }

  createQuestion(quizId: string, payload: BaseQuestion) {
    return this.http.post(`/api/quizzes/${quizId}/questions`, payload).pipe(map((result) => result as Question));
  }

  updateQuestion(id: string, payload: PartialQuestion) {
    return this.http.patch(`/api/questions/${id}`, payload).pipe(map((result) => result as Question));
  }

  deleteQuestion(id: string) {
    return this.http.delete(`/api/questions/${id}`).pipe(map((result) => (result ? true : false)));
  }

  getAssessments(params?: any) {
    return this.http
      .get(`/api/assessments`, { params: this.constructParams(params) })
      .pipe(map((result) => result as Assessment[]));
  }

  getAssessment(id: string, includeQuestions = false) {
    return this.http
      .get(`/api/assessments/${id}`, { params: this.constructParams({ include_questions: includeQuestions }) })
      .pipe(map((result) => result as Assessment));
  }

  createAssessment(quizId: string, payload: BaseAssessment) {
    return this.http.post(`/api/quizzes/${quizId}/assessments`, payload).pipe(map((result) => result as Assessment));
  }

  updateAssessment(id: string, payload: PartialAssessment) {
    return this.http.patch(`/api/assessments/${id}`, payload).pipe(map((result) => result as Assessment));
  }

  deleteAssessment(id: string) {
    return this.http.delete(`/api/assessments/${id}`).pipe(map((result) => (result ? true : false)));
  }

  getResults(params?: any) {
    return this.http
      .get(`/api/results`, { params: this.constructParams(params) })
      .pipe(map((result) => result as AssessmentResult[]));
  }

  getAssessmentResults(assessmentId: string) {
    return this.http.get(`/api/assessment/${assessmentId}/results`).pipe(map((result) => result as AssessmentResult[]));
  }

  getResult(id: string) {
    return this.http.get(`/api/results/${id}`).pipe(map((result) => result as AssessmentResult));
  }

  submitAssessmentResult(assessmentId: string, payload: BaseAssesmentResult) {
    return this.http
      .post(`/api/assessments/${assessmentId}/results`, payload)
      .pipe(map((result) => result as AssessmentResult));
  }

  deleteResult(id: string) {
    return this.http.delete(`/api/results/${id}`).pipe(map((result) => (result ? true : false)));
  }

  getImage(id: string) {
    return this.http.get(`/api/images/${id}`, { responseType: 'text' });
  }

  private constructParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const key of Object.keys(params)) {
      httpParams = httpParams.append(key, params[key]);
    }
    return httpParams;
  }
}
