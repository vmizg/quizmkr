import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { CreatorComponent } from './components/creator/creator.component';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { HomeComponent } from './components/home/home.component';
import { LibraryComponent } from './components/library/library.component';
import { AuthGuard } from './guards/auth.guard';
import { PendingChangesGuard } from './guards/pending-changes.guard';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'creator/:qid/questions',
    component: QuestionsComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'creator/:qid',
    component: CreatorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'creator',
    component: CreatorComponent,
    canActivate: [AuthGuard],
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'questions/:qid',
    redirectTo: 'creator/:qid/questions',
    pathMatch: 'full',
  },
  {
    path: 'results/:rid',
    component: ResultsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'result/:aid',
    redirectTo: 'results/:rid',
    pathMatch: 'full',
  },
  {
    path: 'assessments/:aid',
    component: RunningAssessmentComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'assessment/:aid',
    redirectTo: 'assessments/:aid',
    pathMatch: 'full',
  },
  {
    path: 'library/:qid',
    component: AssessmentComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'library',
    component: LibraryComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'quiz/:qid',
    redirectTo: 'library/:qid',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
