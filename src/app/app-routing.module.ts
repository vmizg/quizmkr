import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { CreatorComponent } from './components/creator/creator.component';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { HomeComponent } from './components/home/home.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'creator', component: CreatorComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'creator/:id', component: QuestionsComponent, canDeactivate: [PendingChangesGuard] },
  { path: 'assessment', component: AssessmentComponent },
  { path: 'assessment/:id', component: AssessmentComponent },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
