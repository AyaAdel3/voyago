import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourGuides } from './tour-guides';

describe('TourGuides', () => {
  let component: TourGuides;
  let fixture: ComponentFixture<TourGuides>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourGuides],
    }).compileComponents();

    fixture = TestBed.createComponent(TourGuides);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
