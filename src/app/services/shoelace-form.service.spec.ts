import { TestBed } from '@angular/core/testing';

import { ShoelaceFormService } from './shoelace-form.service';

describe('ShoelaceFormService', () => {
  let service: ShoelaceFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShoelaceFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
