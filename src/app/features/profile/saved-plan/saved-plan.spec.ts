import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedPlan } from './saved-plan';

describe('SavedPlan', () => {
  let component: SavedPlan;
  let fixture: ComponentFixture<SavedPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedPlan],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
