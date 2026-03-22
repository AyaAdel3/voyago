import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {
  public plans: any[] = []; 
  private savedPlanSubject = new BehaviorSubject<any>(null);
  public savedPlan$ = this.savedPlanSubject.asObservable();

  constructor() {
    const active = localStorage.getItem('user_plan');
    if (active) this.savedPlanSubject.next(JSON.parse(active));
  }

  savePlan(planData: any) {
    console.log('Saving Plan...', planData); // عشان نتأكد إنها اتنادت
    localStorage.setItem('user_plan', JSON.stringify(planData));
    this.savedPlanSubject.next(planData);
  }
}