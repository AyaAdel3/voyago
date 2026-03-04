import { TestBed } from '@angular/core/testing';

import { Flowbite } from './flowbite';

describe('Flowbite', () => {
  let service: Flowbite;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Flowbite);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
