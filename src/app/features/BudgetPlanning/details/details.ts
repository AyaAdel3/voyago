// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// صفحة تفاصيل البلان المحفوظ:
//   - Selected Hotel card كبير + Cost Breakdown widget
//   - Selected Restaurants grid
//   - Tourist Attractions grid
//   - Save Trip Plan button
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetPlan } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';

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
    private route:         ActivatedRoute,
    public  router:        Router,
  ) {}

  ngOnInit(): void {
    // جيب الـ plan من الـ service
    this.plan = this.budgetService.getCurrentPlan();

    // لو مفيش plan ارجع للـ main
    if (!this.plan) {
      this.router.navigate(['/Budget Planning']);
    }
  }

  // ── Navigation ────────────────────────────────────────────
  viewHotelDetails(id: number):      void { this.router.navigate(['/hotels/details', id]); }
  viewRestaurantDetails(id: number): void { this.router.navigate(['/restaurant/details', id]); }
  viewAttractionDetails(id: number): void { this.router.navigate(['/tourist-attraction/details', id]); }

  // ── Save Trip Plan (يحفظه في الـ profile/saved-plan) ──────
  saveTripPlan(): void {
    if (this.plan) {
      this.budgetService.savePlan(this.plan);
      // TODO: فيديباك للمستخدم (toast notification)
      this.router.navigate(['/profile/saved-plan']);
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  starsArray(n: number): number[] { return Array(Math.round(n)).fill(0); }

  get hotelTotalCost(): number {
    if (!this.plan?.selectedHotel) return 0;
    return this.plan.selectedHotel.pricePerNight * this.plan.days;
  }
}