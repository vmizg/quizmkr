import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';
import { BaseUrlInterceptor } from './interceptors/base-url.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { CreatorComponent } from './components/creator/creator.component';
import { ApiService } from './services/api.service';
import { QuestionsComponent } from './components/creator/questions/questions.component';
import { AuthGuard } from './guards/auth.guard';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { QuizzesComponent } from './components/quizzes/quizzes.component';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { CardHeaderComponent } from './components/card-header/card-header.component';
import { PageLayoutComponent } from './components/page-layout/page-layout.component';
import { environment } from '../environments/environment';

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
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AuthModule.forRoot({
      domain: environment.authDomain,
      clientId: environment.authClientId,
      authorizationParams: {
        audience: environment.apiUrl,
        redirect_uri: window.location.origin,
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: '/api/*',
          },
        ],
      },
    }),
    AppRoutingModule,
    ScrollingModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BaseUrlInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true
    },
    ApiService,
    AuthGuard,
    PendingChangesGuard,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
