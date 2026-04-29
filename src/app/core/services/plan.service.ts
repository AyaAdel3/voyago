import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SavedPlan {
  id: string;
  name: string;
  hotel?: any;
  restaurants?: any[];
  tourGuides?: any[];
  attractions?: any[];
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private storageKey = 'voyago_plans';
  private plansSubject = new BehaviorSubject<SavedPlan[]>([]);
  public plans$ = this.plansSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) this.plansSubject.next(JSON.parse(saved));
  }

  getPlans(): SavedPlan[] {
    return this.plansSubject.getValue();
  }

  savePlan(planData: SavedPlan) {
    const plans = this.getPlans();
    const existingIndex = plans.findIndex(p => p.id === planData.id);
    if (existingIndex !== -1) {
      plans[existingIndex] = planData;
    } else {
      plans.push(planData);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(plans));
    this.plansSubject.next(plans);
  }

  deletePlan(planId: string) {
    const plans = this.getPlans().filter(p => p.id !== planId);
    localStorage.setItem(this.storageKey, JSON.stringify(plans));
    this.plansSubject.next(plans);
  }
}