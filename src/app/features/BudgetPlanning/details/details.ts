// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// بتعرض الـ BudgetPlanResponse الراجع من POST /budget-planning/save
// بتتفتح مباشرة بعد main.savePlan() أو plan.savePlan() (currentPlan في الذاكرة)
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BudgetPlanResponse } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';

@Component({
  selector: 'app-budget-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  plan: BudgetPlanResponse | null = null;

  constructor(
    private budgetService: BudgetService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.plan = this.budgetService.getCurrentPlan();

    if (!this.plan) {
      this.router.navigate(['/budget-planning']);
    }
  }

  // ── Navigation ─────────────────────────────────────────────

  viewHotelDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  viewRestaurantDetails(id: number): void {
    this.router.navigate(['/restaurant/details', id]);
  }

  viewAttractionDetails(id: number): void {
    this.router.navigate(['/tourist-attraction/details', id]);
  }

  // ── Helpers ───────────────────────────────────────────────

  starsArray(n: number): number[] {
    return Array(Math.round(n)).fill(0);
  }

  /** البلان أصلاً متحفظ في الباك من savePlan()، هنا بس بنرجع لصفحة البلانز */
  goToSavedPlans(): void {
    this.budgetService.clearCurrentPlan();
    this.router.navigate(['/profile/saved-plan']);
  }
}