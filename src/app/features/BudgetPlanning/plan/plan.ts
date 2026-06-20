// ============================================================
// plan.ts  →  src/app/features/BudgetPlanning/plan/
// صفحة الـ Budget Planning جوه البروفايل (اليوزر مسجل دخول بالفعل):
//   - Input: total budget + days → POST /budget-planning/suggest
//   - Save → POST /budget-planning/save
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SuggestBudgetPlanResponse,
  SuggestedHotelItem,
  SuggestedRestaurantItem,
  SuggestedAttractionItem,
  BudgetBreakdown,
  SaveBudgetPlanRequest,
} from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';

@Component({
  selector: 'app-budget-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.html',
  styleUrl: './plan.css',
})
export class Plan implements OnInit {

  totalBudget: number | null = null;
  days = 1;
  inputError = '';
  saveError = '';
  isLoading = false;
  planGenerated = false;
  breakdown!: BudgetBreakdown;
  dailyBudget = 0;

  recommendedHotels:      SuggestedHotelItem[]      = [];
  availableRestaurants:   SuggestedRestaurantItem[] = [];
  availableAttractions:   SuggestedAttractionItem[] = [];

  selectedHotel:       SuggestedHotelItem      | null = null;
  selectedRestaurants: SuggestedRestaurantItem[] = [];
  selectedAttractions: SuggestedAttractionItem[] = [];

  // ── Hotel Slider ──────────────────────────────────────────
  hotelIndex = 0;
  readonly HOTELS_VISIBLE = 3;

  hotelWarning = '';
  restaurantWarning = '';
  attractionWarning = '';

  // الحد الأدنى للميزانية — بييجي من /budget-planning/minimum
  minRequiredBudget = 0;

  constructor(
    private budgetService: BudgetService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.recalcMinBudget();
  }

  private recalcMinBudget(): void {
    this.budgetService.getMinimumBudget(this.days).subscribe({
      next: (res) => {
        this.minRequiredBudget = res.minimumTotalBudget;
        this.cdr.detectChanges();
      },
      error: () => {
        // فشل الجلب مش حاجة حرجة — نسيب minRequiredBudget = 0 ونخلي الباك يرفض لو الميزانية قليلة فعلاً
        this.minRequiredBudget = 0;
      },
    });
  }

  onDaysChange(): void {
    this.recalcMinBudget();
    if (this.planGenerated) this.resetPlan();
    if (this.inputError) this.inputError = '';
  }

  // ════════════════════════════════════════════════════════
  // GENERATE PLAN — POST /budget-planning/suggest
  // ════════════════════════════════════════════════════════

  generatePlan(): void {
    if (!this.totalBudget || this.totalBudget <= 0) {
      this.inputError = 'Please enter a valid total budget.';
      return;
    }

    if (!this.days || this.days <= 0) {
      this.inputError = 'Please enter a valid number of days.';
      return;
    }

    if (this.minRequiredBudget > 0 && this.totalBudget < this.minRequiredBudget) {
      this.inputError = `⚠ Budget is too low for ${this.days} day${this.days > 1 ? 's' : ''}. Minimum required is ${this.minRequiredBudget.toLocaleString()}LE.`;
      return;
    }

    this.inputError = '';
    this.isLoading = true;

    this.budgetService.suggestPlan(this.totalBudget, this.days).subscribe({
      next: (res: SuggestBudgetPlanResponse) => {
        this.breakdown = {
          hotelBudget:      res.hotelBudget,
          restaurantBudget: res.restaurantBudget,
          attractionBudget: res.attractionBudget,
        };
        this.dailyBudget = this.days > 0 ? Math.round(this.totalBudget! / this.days) : this.totalBudget!;

        this.recommendedHotels    = res.suggestedHotels;
        this.availableRestaurants = res.suggestedRestaurants;
        this.availableAttractions = res.suggestedAttractions;

        this.selectedHotel = null;
        this.selectedRestaurants = [];
        this.selectedAttractions = [];

        this.hotelIndex = 0;
        this.hotelWarning = '';
        this.restaurantWarning = '';
        this.attractionWarning = '';

        this.planGenerated = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.inputError = err?.error?.message
          ?? '⚠ Your budget is too low for this trip. Please increase it and try again.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Hotel Slider Methods ──────────────────────────────────

  visibleHotels(): SuggestedHotelItem[] {
    return this.recommendedHotels.slice(
      this.hotelIndex,
      this.hotelIndex + this.HOTELS_VISIBLE
    );
  }

  scrollHotels(dir: 'prev' | 'next'): void {
    if (dir === 'next') {
      const max = this.recommendedHotels.length - this.HOTELS_VISIBLE;
      this.hotelIndex = Math.min(this.hotelIndex + 1, max);
    } else {
      this.hotelIndex = Math.max(0, this.hotelIndex - 1);
    }
  }

  canScrollHotels(dir: 'prev' | 'next'): boolean {
    if (dir === 'prev') return this.hotelIndex > 0;
    return this.hotelIndex < this.recommendedHotels.length - this.HOTELS_VISIBLE;
  }

  // ── Hotel ─────────────────────────────────────────────────

  addHotelToPlan(hotel: SuggestedHotelItem): void {
    if (this.selectedHotel?.id === hotel.id) {
      this.selectedHotel = null;
      this.hotelWarning = '';
      return;
    }

    this.hotelWarning = hotel.estimatedTotalPrice > this.breakdown.hotelBudget
      ? `⚠ Exceeds hotel budget by ${(hotel.estimatedTotalPrice - this.breakdown.hotelBudget).toLocaleString()}LE`
      : '';

    this.selectedHotel = hotel;
  }

  isHotelSelected(id: number): boolean {
    return this.selectedHotel?.id === id;
  }

  // ── Restaurants ───────────────────────────────────────────

  get restaurantBudgetUsed(): number {
    return this.selectedRestaurants.reduce((s, r) => s + r.estimatedPrice, 0);
  }

  get restaurantBudgetRemaining(): number {
    return this.breakdown
      ? this.breakdown.restaurantBudget - this.restaurantBudgetUsed
      : 0;
  }

  addRestaurantToPlan(r: SuggestedRestaurantItem): void {
    const exists = this.selectedRestaurants.find(x => x.id === r.id);

    if (exists) {
      this.selectedRestaurants = this.selectedRestaurants.filter(x => x.id !== r.id);
      this.restaurantWarning = '';
      return;
    }

    if (this.restaurantBudgetUsed + r.estimatedPrice > this.breakdown.restaurantBudget) {
      this.restaurantWarning = `⚠ Budget exceeded. Only ${this.restaurantBudgetRemaining.toLocaleString()}LE remaining.`;
      return;
    }

    this.selectedRestaurants = [...this.selectedRestaurants, r];
  }

  isRestaurantSelected(id: number): boolean {
    return this.selectedRestaurants.some(r => r.id === id);
  }

  // ── Attractions ───────────────────────────────────────────

  get selectedAttractionsCost(): number {
    return this.selectedAttractions.reduce((s, a) => s + a.ticketPrice, 0);
  }

  get attractionBudgetRemaining(): number {
    return this.breakdown
      ? this.breakdown.attractionBudget - this.selectedAttractionsCost
      : 0;
  }

  addAttractionToPlan(a: SuggestedAttractionItem): void {
    const exists = this.selectedAttractions.find(x => x.id === a.id);

    if (exists) {
      this.selectedAttractions = this.selectedAttractions.filter(x => x.id !== a.id);
      this.attractionWarning = '';
      return;
    }

    if (this.selectedAttractionsCost + a.ticketPrice > this.breakdown.attractionBudget) {
      this.attractionWarning = `⚠ Budget exceeded. Only ${this.attractionBudgetRemaining.toLocaleString()}LE remaining.`;
      return;
    }

    this.selectedAttractions = [...this.selectedAttractions, a];
  }

  isAttractionSelected(id: number): boolean {
    return this.selectedAttractions.some(a => a.id === id);
  }

  // ── Totals ────────────────────────────────────────────────

  get totalCost(): number {
    const hotelCost = this.selectedHotel?.estimatedTotalPrice ?? 0;
    return hotelCost + this.restaurantBudgetUsed + this.selectedAttractionsCost;
  }

  get budgetRemaining(): number {
    return (this.totalBudget ?? 0) - this.totalCost;
  }

  // ── Save Plan — POST /budget-planning/save ─────────────────

  savePlan(): void {
    if (!this.selectedHotel) {
      this.saveError = '⚠ Please select a hotel first.';
      return;
    }
    if (this.selectedRestaurants.length === 0) {
      this.saveError = '⚠ Please select at least one restaurant.';
      return;
    }
    if (this.selectedAttractions.length === 0) {
      this.saveError = '⚠ Please select at least one attraction.';
      return;
    }
    this.saveError = '';

    const request: SaveBudgetPlanRequest = {
      totalBudget:   this.totalBudget!,
      numberOfDays:  this.days,
      hotelId:       this.selectedHotel.id,
      restaurantIds: this.selectedRestaurants.map(r => r.id),
      attractionIds: this.selectedAttractions.map(a => a.id),
    };

    this.isLoading = true;
    this.budgetService.savePlan(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.budgetService.setCurrentPlan(res);
        this.router.navigate(['/budget-planning/details', res.id]);
      },
      error: (err) => {
        this.isLoading = false;
        this.saveError = err?.error?.message ?? '⚠ Could not save your plan. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Reset ─────────────────────────────────────────────────

  deletePlan(): void {
    this.resetPlan();
    this.totalBudget = null;
    this.days = 1;
    this.recalcMinBudget();
  }

  private resetPlan(): void {
    this.planGenerated = false;
    this.selectedHotel = null;
    this.selectedRestaurants = [];
    this.selectedAttractions = [];
    this.hotelIndex = 0;
    this.hotelWarning = '';
    this.restaurantWarning = '';
    this.attractionWarning = '';
    this.saveError = '';
  }

  // ── Navigation ────────────────────────────────────────────

  viewHotelDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  viewRestaurantDetails(id: number): void {
    this.router.navigate(['/restaurant/details', id]);
  }

  viewAttractionDetails(id: number): void {
    this.router.navigate(['/tourist-attraction/details', id]);
  }

  starsArray(n: number): number[] {
    return Array(Math.round(n)).fill(0);
  }
}