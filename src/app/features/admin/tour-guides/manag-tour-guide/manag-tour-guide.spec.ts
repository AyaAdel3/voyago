import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTourGuide } from './manag-tour-guide';

describe('ManageTourGuide', () => {
  let component: ManageTourGuide;
  let fixture: ComponentFixture<ManageTourGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageTourGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTourGuide);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
