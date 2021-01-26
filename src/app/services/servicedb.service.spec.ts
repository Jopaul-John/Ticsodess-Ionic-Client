import { TestBed } from '@angular/core/testing';

import { ServicedbService } from './servicedb.service';

describe('ServicedbService', () => {
  let service: ServicedbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicedbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
