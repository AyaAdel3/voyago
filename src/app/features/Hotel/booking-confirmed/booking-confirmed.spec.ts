import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingConfirmed } from './booking-confirmed';

describe('BookingConfirmed', () => {
  let component: BookingConfirmed;
  let fixture: ComponentFixture<BookingConfirmed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingConfirmed],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingConfirmed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
