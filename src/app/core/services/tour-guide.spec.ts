import { TestBed } from '@angular/core/testing';

import { TourGuide } from './tour-guide';

describe('TourGuide', () => {
  let service: TourGuide;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TourGuide);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
