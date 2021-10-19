import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { CreatorComponent } from './components/creator/creator.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'creator', component: CreatorComponent },
  { path: 'assessment/:id', component: AssessmentComponent },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
