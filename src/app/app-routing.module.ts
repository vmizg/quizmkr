import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { CreatorComponent } from './components/creator/creator.component';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { HomeComponent } from './components/home/home.component';
import { QuizzesComponent } from './components/quizzes/quizzes.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'creator/:qid/questions', component: QuestionsComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'creator/:qid', component: CreatorComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'creator', component: CreatorComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'quizzes/:qid/assessment/:aid', component: RunningAssessmentComponent },
  { path: 'quizzes/:qid', component: AssessmentComponent },
  { path: 'quizzes', component: QuizzesComponent },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
