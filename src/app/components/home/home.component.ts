import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AssessmentSettings, BaseQuiz } from 'src/app/models/quiz';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private $clockSubscription?: Subscription;

  inProgress: AssessmentSettings[] = [];
  latest: BaseQuiz[] = [];
  currentDate = new Date();

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.$clockSubscription = interval(1000).pipe(
      tap(() => this.currentDate = new Date())
    ).subscribe();
    this.apiService.getAssessments().subscribe((data) => {
      if (data) {
        this.inProgress = data;
      }
    });
    this.apiService.getQuizzes('?_limit=5').subscribe((data) => {
      if (data) {
        this.latest = data;
      }
    });
  }

  ngOnDestroy() {
    this.$clockSubscription?.unsubscribe();
  }
}
