import { ComponentFixture, TestBed } from '@angular/core/testing';

import { favorites } from './favorites';

describe('Favorites', () => {
  let component: favorites;
  let fixture: ComponentFixture<favorites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [favorites],
    }).compileComponents();

    fixture = TestBed.createComponent(favorites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
