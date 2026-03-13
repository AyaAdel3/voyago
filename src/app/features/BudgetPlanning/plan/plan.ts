// ============================================================
// plan.ts  →  src/app/features/BudgetPlanning/plan/
// صفحة الـ Budget Planning:
//   - Input: total budget + days → Generate Plan
//   - Output: hotels/restaurants/attractions كروت مع Add to Plan
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { Restaurant } from '../../../core/model/restaurant.model';
import { Attraction, BudgetBreakdown, BudgetPlan } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';

@Component({
  selector: 'app-budget-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.html',   // ← اسم الملف الصح
  styleUrl: './plan.css',       // ← اسم الملف الصح
})
export class Plan implements OnInit {

  // ── Input fields ──────────────────────────────────────────
  totalBudget = 0;
  days        = 1;
  inputError  = '';

  // ── Generated data ────────────────────────────────────────
  planGenerated = false;
  breakdown!:   BudgetBreakdown;
  dailyBudget   = 0;

  allHotels:      Hotel[]      = [];
  allRestaurants: Restaurant[] = [];
  allAttractions: Attraction[] = [];

  recommendedHotels:      Hotel[]      = [];
  recommendedRestaurants: Restaurant[] = [];
  recommendedAttractions: Attraction[] = [];

  // ── User selections ───────────────────────────────────────
  selectedHotel:       Hotel       | null = null;
  selectedRestaurants: Restaurant[]       = [];
  selectedAttractions: Attraction[]       = [];

  // ── Carousel offsets (عدد الكروت المرئية = 3) ─────────────
  hotelOffset      = 0;
  restaurantOffset = 0;
  attractionOffset = 0;

  // ── Warnings ──────────────────────────────────────────────
  hotelWarning      = '';
  restaurantWarning = '';
  attractionWarning = '';

  constructor(
    private budgetService: BudgetService,
    private router:        Router,
    private cdr:           ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // جيب البيانات من الـ service في الـ background
    this.budgetService.getHotels().subscribe(h      => this.allHotels      = h);
    this.budgetService.getRestaurants().subscribe(r => this.allRestaurants = r);
    this.budgetService.getAttractions().subscribe(a => this.allAttractions = a);
  }

  // ════════════════════════════════════════════════════════
  // GENERATE PLAN
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
    this.inputError = '';

    this.breakdown   = this.budgetService.calculateBreakdown(this.totalBudget);
    this.dailyBudget = this.budgetService.calculateDailyBudget(this.totalBudget, this.days);

    this.recommendedHotels      = this.budgetService.getRecommendedHotels(this.allHotels, this.breakdown.hotelBudget, this.days);
    this.recommendedRestaurants = this.budgetService.getRecommendedRestaurants(this.allRestaurants, this.breakdown.restaurantBudget);
    this.recommendedAttractions = this.budgetService.getRecommendedAttractions(this.allAttractions, this.breakdown.attractionBudget, this.days);

    // reset selections
    this.selectedHotel        = null;
    this.selectedRestaurants  = [];
    this.selectedAttractions  = [];
    this.hotelOffset          = 0;
    this.restaurantOffset     = 0;
    this.attractionOffset     = 0;
    this.hotelWarning         = '';
    this.restaurantWarning    = '';
    this.attractionWarning    = '';

    this.planGenerated = true;
    this.cdr.detectChanges();
  }

  // ════════════════════════════════════════════════════════
  // HOTEL SELECTION — يختار هوتيل واحد بس
  // ════════════════════════════════════════════════════════

  addHotelToPlan(hotel: Hotel): void {
    if (this.selectedHotel?.id === hotel.id) {
      this.selectedHotel = null;
      this.hotelWarning  = '';
      return;
    }
    const cost = hotel.pricePerNight * this.days;
    this.hotelWarning  = cost > this.breakdown.hotelBudget
      ? `⚠ This hotel exceeds your hotel budget by ${(cost - this.breakdown.hotelBudget).toLocaleString()}LE`
      : '';
    this.selectedHotel = hotel;
  }

  isHotelSelected(id: number): boolean {
    return this.selectedHotel?.id === id;
  }

  // ════════════════════════════════════════════════════════
  // RESTAURANT SELECTION — max = days
  // ════════════════════════════════════════════════════════

  addRestaurantToPlan(r: Restaurant): void {
    const idx = this.selectedRestaurants.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      this.selectedRestaurants = this.selectedRestaurants.filter(x => x.id !== r.id);
      this.restaurantWarning   = '';
      return;
    }
    if (this.selectedRestaurants.length >= this.days) {
      this.restaurantWarning = `⚠ You can select up to ${this.days} restaurant${this.days > 1 ? 's' : ''} for your ${this.days}-day trip.`;
      return;
    }
    this.selectedRestaurants = [...this.selectedRestaurants, r];
    if (this.selectedRestaurants.length >= this.days) {
      this.restaurantWarning = `✓ You've reached the maximum restaurants for your trip.`;
    }
  }

  isRestaurantSelected(id: number): boolean {
    return this.selectedRestaurants.some(r => r.id === id);
  }

  // ════════════════════════════════════════════════════════
  // ATTRACTION SELECTION — max = max(3, days×0.5)
  // ════════════════════════════════════════════════════════

  get maxAttractions(): number {
    return Math.max(3, Math.floor(this.days * 0.5));
  }

  addAttractionToPlan(a: Attraction): void {
    const idx = this.selectedAttractions.findIndex(x => x.id === a.id);
    if (idx >= 0) {
      this.selectedAttractions = this.selectedAttractions.filter(x => x.id !== a.id);
      this.attractionWarning   = '';
      return;
    }
    if (this.selectedAttractions.length >= this.maxAttractions) {
      this.attractionWarning = `⚠ You can select up to ${this.maxAttractions} attractions for your ${this.days}-day trip.`;
      return;
    }
    const newCost = this.selectedAttractionsCost + a.entryFee;
    if (newCost > this.breakdown.attractionBudget) {
      this.attractionWarning = `⚠ This attraction exceeds your attractions budget.`;
      return;
    }
    this.selectedAttractions = [...this.selectedAttractions, a];
    if (this.selectedAttractions.length >= this.maxAttractions - 1) {
      this.attractionWarning = `⚠ Approaching your attractions limit.`;
    }
  }

  isAttractionSelected(id: number): boolean {
    return this.selectedAttractions.some(a => a.id === id);
  }

  get selectedAttractionsCost(): number {
    return this.selectedAttractions.reduce((s, a) => s + a.entryFee, 0);
  }

  // ════════════════════════════════════════════════════════
  // TOTAL COST
  // ════════════════════════════════════════════════════════

  get totalCost(): number {
    return this.budgetService.calculateTotalCost(
      this.selectedHotel,
      this.selectedRestaurants,
      this.selectedAttractions,
      this.days,
    );
  }

  get budgetRemaining(): number {
    return this.totalBudget - this.totalCost;
  }

  // ════════════════════════════════════════════════════════
  // SAVE / DELETE PLAN
  // ════════════════════════════════════════════════════════

  savePlan(): void {
    const plan: BudgetPlan = {
      id:                  Date.now(),
      totalBudget:         this.totalBudget,
      days:                this.days,
      dailyBudget:         this.dailyBudget,
      selectedHotel:       this.selectedHotel,
      selectedRestaurants: this.selectedRestaurants,
      selectedAttractions: this.selectedAttractions,
      totalCost:           this.totalCost,
      createdAt:           new Date().toISOString(),
    };
    this.budgetService.setCurrentPlan(plan);
    this.budgetService.savePlan(plan);
    // ← ينقل لـ details مش /budget-planning/details/:id
    this.router.navigate(['/budget-planning/details', plan.id]);
  }

  deletePlan(): void {
    this.planGenerated       = false;
    this.selectedHotel       = null;
    this.selectedRestaurants = [];
    this.selectedAttractions = [];
    this.totalBudget         = 0;
    this.days                = 1;
  }

  // ════════════════════════════════════════════════════════
  // CAROUSEL
  // ════════════════════════════════════════════════════════

  canScroll(list: any[], offset: number, dir: 'prev' | 'next', visible = 3): boolean {
    return dir === 'next' ? offset + visible < list.length : offset > 0;
  }

  scrollHotels(dir: 'prev' | 'next'):      void { this.hotelOffset      = this.scroll(dir, this.hotelOffset,      this.recommendedHotels.length); }
  scrollRestaurants(dir: 'prev' | 'next'): void { this.restaurantOffset = this.scroll(dir, this.restaurantOffset, this.recommendedRestaurants.length); }
  scrollAttractions(dir: 'prev' | 'next'): void { this.attractionOffset = this.scroll(dir, this.attractionOffset, this.recommendedAttractions.length); }

  private scroll(dir: 'prev' | 'next', offset: number, total: number, visible = 3): number {
    if (dir === 'next' && offset + visible < total) return offset + 1;
    if (dir === 'prev' && offset > 0)               return offset - 1;
    return offset;
  }

  visibleHotels():      Hotel[]      { return this.recommendedHotels     .slice(this.hotelOffset,      this.hotelOffset      + 3); }
  visibleRestaurants(): Restaurant[] { return this.recommendedRestaurants.slice(this.restaurantOffset, this.restaurantOffset + 3); }
  visibleAttractions(): Attraction[] { return this.recommendedAttractions.slice(this.attractionOffset, this.attractionOffset + 3); }

  // ── Navigation ────────────────────────────────────────────
  viewHotelDetails(id: number):      void { this.router.navigate(['/hotels/details', id]); }
  viewRestaurantDetails(id: number): void { this.router.navigate(['/restaurant/details', id]); }
  viewAttractionDetails(id: number): void { this.router.navigate(['/tourist-attraction/details', id]); }

  starsArray(n: number): number[] { return Array(n).fill(0); }
}