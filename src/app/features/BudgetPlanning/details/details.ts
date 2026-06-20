// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// FIXED: حل TS2345 + إضافة id و name + تصحيح الـ navigation routes
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetPlan } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';
import { PlanService } from '../../../core/services/plan.service';

@Component({
  selector: 'app-budget-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  plan: BudgetPlan | null = null;

  constructor(
    private budgetService: BudgetService,
    private planService: PlanService,
    private route: ActivatedRoute,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.plan = this.budgetService.getCurrentPlan();

    if (!this.plan) {
      this.router.navigate(['/budget-planning']); // تم تعديل المسار
    }
  }

  // ── Navigation ─────────────────────────────────────────────
  // ✅ مصححة عشان تطابق نفس الـ routes المستخدمة في باقي المشروع
  // (نفس الـ paths اللي في hotel/card.ts, restaurant/card.ts, attraction/card.ts)

  viewHotelDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  viewRestaurantDetails(id: number): void {
    this.router.navigate(['/restaurant/details', id]);
  }

  viewAttractionDetails(id: number): void {
    this.router.navigate(['/tourist-attraction/details', id]);
  }

  // ── Save Trip Plan (FIXED) ────────────────────────────────

  saveTripPlan(): void {
    if (!this.plan) return;

    const savedPlan = {
      id: crypto.randomUUID(), // حل المشكلة هنا
      name: this.generatePlanName(),

      hotel: this.plan.selectedHotel,
      restaurants: this.plan.selectedRestaurants,
      attractions: this.plan.selectedAttractions,
      totalCost: this.plan.totalCost
    };

    this.planService.savePlan(savedPlan);
    this.budgetService.savePlan(this.plan);

    this.router.navigate(['/profile/saved-plan']);
  }

  // ── Helpers ───────────────────────────────────────────────

  private generatePlanName(): string {
    if (!this.plan) return 'My Trip';

    return `Trip (${this.plan.days} days) - ${this.plan.totalCost} EGP`;
  }

  starsArray(n: number): number[] {
    return Array(Math.round(n)).fill(0);
  }

  get hotelTotalCost(): number {
    if (!this.plan?.selectedHotel) return 0;
    return this.plan.selectedHotel.pricePerNight * this.plan.days;
  }
}