import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
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
import { LibraryComponent } from './components/library/library.component';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { RunningAssessmentComponent } from './components/assessment/running/running.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { CardHeaderComponent } from './components/card-header/card-header.component';
import { PageLayoutComponent } from './components/page-layout/page-layout.component';
import { environment } from '../environments/environment';
import { CardLayoutComponent } from './components/card-layout/card-layout.component';
import { GridLayoutComponent } from './components/grid-layout/grid-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreatorComponent,
    AssessmentComponent,
    RunningAssessmentComponent,
    QuestionsComponent,
    LibraryComponent,
    ResultsComponent,
    CardHeaderComponent,
    PageLayoutComponent,
    CardLayoutComponent,
    GridLayoutComponent,
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
            uri: environment.apiUrl + '/api/*',
          },
        ],
      },
    }),
    AppRoutingModule,
    ScrollingModule,
    ExperimentalScrollingModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BaseUrlInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
    ApiService,
    AuthGuard,
    PendingChangesGuard,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
