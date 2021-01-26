import { TestBed } from '@angular/core/testing';

import { AdmobfreeService } from './admobfree.service';

describe('AdmobfreeService', () => {
  let service: AdmobfreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdmobfreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
