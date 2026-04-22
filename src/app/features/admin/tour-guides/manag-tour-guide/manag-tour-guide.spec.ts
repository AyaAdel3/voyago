import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagTourGuide } from './manag-tour-guide';

describe('ManagTourGuide', () => {
  let component: ManagTourGuide;
  let fixture: ComponentFixture<ManagTourGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagTourGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagTourGuide);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
