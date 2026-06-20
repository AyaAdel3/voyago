// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// بتعرض الـ BudgetPlanResponse الراجع من POST /budget-planning/save
// بتتفتح مباشرة بعد main.savePlan() أو plan.savePlan() (currentPlan في الذاكرة)
//
// ملحوظة: البلان بيتحفظ في الباك أوتوماتيك جوه BudgetService.savePlan()
// (هي اللي بتنادي POST /budget-planning/save)، يعني أي بلان بيوصل هنا
// يبقى أصلاً متسجل في حساب اليوزر، وهيظهر في GET /budget-planning
// (صفحة saved-plan في البروفايل) من غير أي خطوة إضافية.
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

  /**
   * البلان أصلاً اتحفظ في الباك وقت savePlan() (POST /budget-planning/save)،
   * هنا بس بنفضي الـ currentPlan المؤقت ونرجع لصفحة "My Plans" في البروفايل
   * اللي هتجيب كل البلانات (بما فيها دي) من GET /budget-planning.
   */
  goToSavedPlans(): void {
    this.budgetService.clearCurrentPlan();
    this.router.navigate(['/profile/saved-plan']);
  }
}