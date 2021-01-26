import { TestBed } from '@angular/core/testing';

import { InviatationuserService } from './inviatationuser.service';

describe('InviatationuserService', () => {
  let service: InviatationuserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InviatationuserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
