// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// بتعرض الـ BudgetPlanResponse الراجع من POST /budget-planning/save
// بتتفتح مباشرة بعد main.savePlan() أو plan.savePlan() (currentPlan في الذاكرة)
// ============================================================

import { Component, OnInit, HostListener } from '@angular/core';
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

  // ── Slider state — حجم الصفحة بيتغير حسب عرض الشاشة ──────
  // Desktop (>900px): 3 كاردز فالصفحة
  // Tablet  (541–900px): 2 كاردز فالصفحة
  // Mobile  (<=540px): كارد واحد فالصفحة
  // (لازم يطابق breakpoints details.css: 900px و 540px)
  pageSize = 3;

  restaurantPage = 0;
  attractionPage = 0;

  // مفتاح تخزين البلان في sessionStorage — بديل احتياطي للذاكرة
  // (BudgetService.getCurrentPlan()) عشان لو المستخدم عمل reload
  // للصفحة، الصفحة تفضل عارضة نفس البلان من غير ما تتوه أو تحوّل
  // لـ /budget-planning. sessionStorage (مش localStorage) عشان
  // البلان المؤقت ده يتصفر طبيعي لما المستخدم يقفل التاب.
  private readonly STORAGE_KEY = 'budget-planning:current-plan';

  constructor(
    private budgetService: BudgetService,
    public router: Router,
  ) {}

  ngOnInit(): void {
    // 1) جرّب الذاكرة الأساسية (BudgetService) الأول
    this.plan = this.budgetService.getCurrentPlan();

    // 2) لو فاضية (حصل reload وراحت الذاكرة)، جرّب sessionStorage
    if (!this.plan) {
      this.plan = this.loadPlanFromStorage();
    }

    // 3) لو لسه مفيش بلان نهائي، فعلاً مفيش داتا نعرضها → رجّع للبدء
    if (!this.plan) {
      this.router.navigate(['/budget-planning']);
      return;
    }

    // خزّن/جدّد النسخة الاحتياطية عشان أي reload تاني يفضل شغال
    this.savePlanToStorage(this.plan);

    this.updatePageSize();
  }

  // ── sessionStorage backup ────────────────────────────────────

  private savePlanToStorage(plan: BudgetPlanResponse): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // sessionStorage ممكن يفشل (خصوصية المتصفح، الخ) — مفيش مشكلة،
      // هنرجع للسيرفر/الـ navigation العادي لو حصل ده
    }
  }

  private loadPlanFromStorage(): BudgetPlanResponse | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BudgetPlanResponse) : null;
    } catch {
      return null;
    }
  }

  private clearPlanFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // تجاهل أي خطأ في الحذف
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const prevPageSize = this.pageSize;
    this.updatePageSize();

    // لو حجم الصفحة تغيّر، رجّع المؤشر لأول صفحة عشان نتجنب
    // صفحة فاضية أو index غير منطقي بعد تغيير عدد العناصر بالصفحة
    if (prevPageSize !== this.pageSize) {
      this.restaurantPage = 0;
      this.attractionPage = 0;
    }
  }

  private updatePageSize(): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (width <= 540) {
      this.pageSize = 1;
    } else if (width <= 900) {
      this.pageSize = 2;
    } else {
      this.pageSize = 3;
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

  /** البلان أصلاً متحفظ في الباك من savePlan()، هنا بس بنرجع لصفحة البلانز */
  goToSavedPlans(): void {
    this.budgetService.clearCurrentPlan();
    this.clearPlanFromStorage();
    this.router.navigate(['/profile/saved-plan']);
  }
}