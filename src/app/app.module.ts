import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { CreatorComponent } from './components/creator/creator.component';
import { ApiService } from './services/api.service';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { QuizzesComponent } from './components/quizzes/quizzes.component';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { CardHeaderComponent } from './components/card-header/card-header.component';
import { PageLayoutComponent } from './components/page-layout/page-layout.component';
import { RedirectComponent } from './components/auth/redirect/redirect.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreatorComponent,
    AssessmentComponent,
    RunningAssessmentComponent,
    QuestionsComponent,
    QuizzesComponent,
    ResultsComponent,
    CardHeaderComponent,
    PageLayoutComponent,
    RedirectComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, ScrollingModule],
  providers: [ApiService, PendingChangesGuard],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
