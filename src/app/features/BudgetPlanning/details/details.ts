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

  // ── Slider state — صفحة كاملة (3 entries) بتظهر في كل مرة ──
  readonly pageSize = 3;

  restaurantPage = 0;
  attractionPage = 0;

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

  // ── Restaurants Slider (صفحات بحجم pageSize) ────────────────

  get restaurantPageCount(): number {
    if (!this.plan) return 0;
    return Math.ceil(this.plan.restaurants.length / this.pageSize);
  }

  get visibleRestaurants() {
    if (!this.plan) return [];
    const start = this.restaurantPage * this.pageSize;
    return this.plan.restaurants.slice(start, start + this.pageSize);
  }

  nextRestaurantPage(): void {
    const total = this.restaurantPageCount;
    if (total <= 1) return;
    this.restaurantPage = (this.restaurantPage + 1) % total;
  }

  prevRestaurantPage(): void {
    const total = this.restaurantPageCount;
    if (total <= 1) return;
    this.restaurantPage = (this.restaurantPage - 1 + total) % total;
  }

  goToRestaurantPage(i: number): void {
    this.restaurantPage = i;
  }

  restaurantPages(): number[] {
    return Array.from({ length: this.restaurantPageCount }, (_, i) => i);
  }

  // ── Attractions Slider (صفحات بحجم pageSize) ────────────────

  get attractionPageCount(): number {
    if (!this.plan) return 0;
    return Math.ceil(this.plan.attractions.length / this.pageSize);
  }

  get visibleAttractions() {
    if (!this.plan) return [];
    const start = this.attractionPage * this.pageSize;
    return this.plan.attractions.slice(start, start + this.pageSize);
  }

  nextAttractionPage(): void {
    const total = this.attractionPageCount;
    if (total <= 1) return;
    this.attractionPage = (this.attractionPage + 1) % total;
  }

  prevAttractionPage(): void {
    const total = this.attractionPageCount;
    if (total <= 1) return;
    this.attractionPage = (this.attractionPage - 1 + total) % total;
  }

  goToAttractionPage(i: number): void {
    this.attractionPage = i;
  }

  attractionPages(): number[] {
    return Array.from({ length: this.attractionPageCount }, (_, i) => i);
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