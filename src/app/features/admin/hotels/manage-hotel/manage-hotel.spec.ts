import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageHotel } from './manage-hotel';

describe('ManageHotel', () => {
  let component: ManageHotel;
  let fixture: ComponentFixture<ManageHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageHotel],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
