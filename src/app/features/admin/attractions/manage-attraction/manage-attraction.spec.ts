import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAttraction } from './manage-attraction';

describe('ManageAttraction', () => {
  let component: ManageAttraction;
  let fixture: ComponentFixture<ManageAttraction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageAttraction],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageAttraction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
