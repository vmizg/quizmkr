import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { CreatorComponent } from './components/creator/creator.component';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { HomeComponent } from './components/home/home.component';
import { QuizzesComponent } from './components/quizzes/quizzes.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { InterceptorService } from './services/interceptor.service';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'creator/:qid/questions', component: QuestionsComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'creator/:qid', component: CreatorComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'creator', component: CreatorComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'questions/:qid', redirectTo: 'creator/:qid/questions', pathMatch: 'full' },
  { path: 'results/:rid', component: ResultsComponent },
  { path: 'result/:aid', redirectTo: 'results/:rid', pathMatch: 'full' },
  { path: 'assessments/:aid', component: RunningAssessmentComponent },
  { path: 'assessment/:aid', redirectTo: 'assessments/:aid', pathMatch: 'full' },
  { path: 'quizzes/:qid', component: AssessmentComponent },
  { path: 'quizzes', component: QuizzesComponent },
  { path: 'quiz/:qid', redirectTo: 'quizzes/:qid', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true,
    },
  ],
})
export class AppRoutingModule {}
