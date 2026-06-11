import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouristAttractionCard } from './card';

describe('Card', () => {
  let component: TouristAttractionCard;
  let fixture: ComponentFixture<TouristAttractionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TouristAttractionCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TouristAttractionCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
