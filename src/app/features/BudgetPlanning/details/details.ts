// ============================================================
// details.ts  →  src/app/features/BudgetPlanning/details/
// التعديل النهائي: إصلاح كل المسارات (Capital & Spaces) لعدم ظهور Not Found
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
    private route:          ActivatedRoute,
    public  router:         Router,
  ) {}

  ngOnInit(): void {
    // جيب الـ plan من الـ service
    this.plan = this.budgetService.getCurrentPlan();

    // لو مفيش plan ارجع للـ main (عدلنا المسار ليطابق الـ Routes بالظبط)
    if (!this.plan) {
      this.router.navigate(['/Budget Planning']);
    }
  }

  // ── Navigation (تم تعديل المسارات لتطابق الـ app.routes.ts بالمللي) ──────
  
  viewHotelDetails(id: number): void { 
    this.router.navigate(['/hotels/details', id]); 
  }

  // الـ R كابتل والـ A كابتل عشان الـ Router يلاقيهم
  viewRestaurantDetails(id: number): void { 
    this.router.navigate(['/Restaurants/details', id]); 
  }

  viewAttractionDetails(id: number): void { 
    this.router.navigate(['/Attractions/details', id]); 
  }

  // ── Save Trip Plan (بينقلك لصفحة الـ Saved Plan في البروفايل) ──────
 saveTripPlan(): void {
  if (this.plan) {
    // 1. تجهيز الداتا بالأسماء اللي صفحة البروفايل "فاهماها" بالظبط
    const dataToSave = {
      hotel: this.plan.selectedHotel,
      restaurants: this.plan.selectedRestaurants, // لازم جمع ومصفوفة
      attractions: this.plan.selectedAttractions, // لازم الاسم ده عشان الـ HTML يلقطه
      totalCost: this.plan.totalCost
    };

    // 2. مناداة السيرفيس (دي أهم خطوة عشان الصور تظهر)
    this.planService.savePlan(dataToSave);

    // 3. الحفظ في الـ Budget Service (لو محتاجه للـ History)
    this.budgetService.savePlan(this.plan);

    // 4. التوجه لصفحة الـ Saved Plans
    this.router.navigate(['/profile/saved-plan']);
  }
}

  // ── Helpers ───────────────────────────────────────────────
  starsArray(n: number): number[] { 
    return Array(Math.round(n)).fill(0); 
  }

  get hotelTotalCost(): number {
    if (!this.plan?.selectedHotel) return 0;
    return this.plan.selectedHotel.pricePerNight * this.plan.days;
  }
}