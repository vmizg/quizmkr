import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-running-assessment',
  templateUrl: './running.component.html',
  styleUrls: ['./running.component.scss']
})
export class RunningAssessmentComponent implements OnInit {
  private $paramsSubscription?: Subscription;

  assessmentId = '';
  quizId = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.$paramsSubscription = combineLatest([this.route.params, this.route.data]).pipe(
      tap(([params, data]) => {
        console.log(data);
        this.assessmentId = params.aid;
        this.quizId = params.qid;
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.$paramsSubscription?.unsubscribe();
  }
}
