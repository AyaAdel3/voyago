import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTourGuides } from './tour-guides';

describe('AdminTourGuides', () => {
  let component: AdminTourGuides;
  let fixture: ComponentFixture<AdminTourGuides>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTourGuides],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTourGuides);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});