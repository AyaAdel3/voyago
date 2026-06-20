// ============================================================
// main.ts  →  src/app/features/BudgetPlanning/main/
// صفحة الـ Budget Planning الرئيسية:
//   - Input: total budget + days → Generate Plan
//   - Output: hotels/restaurants/attractions كروت مع Add to Plan
// ============================================================

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { Restaurant } from '../../../core/model/restaurant.model';
import { Attraction, BudgetBreakdown, BudgetPlan } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

@Component({
  selector: 'app-budget-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements OnInit {

  // ── Auth ──────────────────────────────────────────────────
  private auth      = inject(AuthService);
  private authModal = inject(AuthModalService);

  /** بيستخدم في الـ template (مثلاً [readonly]="!isLoggedIn") */
  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  // ── Input fields ──────────────────────────────────────────
  totalBudget: number | null = null;
  days        = 1;
  inputError  = '';

  // ── Generated data ────────────────────────────────────────
  planGenerated    = false;
  breakdown!:      BudgetBreakdown;
  dailyBudget      = 0;

  allHotels:      Hotel[]      = [];
  allRestaurants: Restaurant[] = [];
  allAttractions: Attraction[] = [];

  recommendedHotels:      Hotel[]      = [];
  recommendedRestaurants: Restaurant[] = [];
  recommendedAttractions: Attraction[] = [];

  // ── User selections ───────────────────────────────────────
  selectedHotel:        Hotel        | null = null;
  selectedRestaurants:  Restaurant[] = [];
  selectedAttractions:  Attraction[] = [];

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
  // AUTH GUARD HELPER
  // ════════════════════════════════════════════════════════

  /**
   * لو مش عامل login → يفتح المودال ويرجع false.
   * لو عامل login → يرجع true.
   * تستخدم قبل أي action محتاج auth (input focus, +/-, generate).
   */
  private requireAuth(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.authModal.openLogin();
      return false;
    }
    return true;
  }

  /** بتستخدم في (focus) و (click) على input الـ Total Budget */
  onBudgetFieldInteraction(event: Event): void {
    if (!this.requireAuth()) {
      (event.target as HTMLInputElement).blur();
    }
  }

  /** بتستخدم في (keydown) على input الـ Total Budget لمنع الكتابة لو مش logged in */
  onBudgetKeydown(event: KeyboardEvent): void {
    if (!this.auth.isLoggedIn()) {
      event.preventDefault();
      this.requireAuth();
    }
  }

  incrementDays(): void {
    if (!this.requireAuth()) return;
    this.days = this.days + 1;
  }

  decrementDays(): void {
    if (!this.requireAuth()) return;
    this.days = this.days > 1 ? this.days - 1 : 1;
  }

  // ════════════════════════════════════════════════════════
  // GENERATE PLAN
  // ════════════════════════════════════════════════════════

  generatePlan(): void {
    // 🔒 لازم يكون عامل login الأول قبل أي Generate
    if (!this.requireAuth()) return;

    // Validation
    if (!this.totalBudget || this.totalBudget <= 0) {
      this.inputError = 'Please enter a valid total budget.';
      return;
    }
    if (!this.days || this.days <= 0) {
      this.inputError = 'Please enter a valid number of days.';
      return;
    }
    this.inputError = '';

    // احسب الـ breakdown
    this.breakdown   = this.budgetService.calculateBreakdown(this.totalBudget);
    this.dailyBudget = this.budgetService.calculateDailyBudget(this.totalBudget, this.days);

    // فلتر الكروت المناسبة
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

    this.planGenerated = true;
    this.cdr.detectChanges();
  }

  // ════════════════════════════════════════════════════════
  // HOTEL SELECTION — يختار هوتيل واحد بس
  // ════════════════════════════════════════════════════════

  addHotelToPlan(hotel: Hotel): void {
    // لو نفس الهوتيل → deselect
    if (this.selectedHotel?.id === hotel.id) {
      this.selectedHotel  = null;
      this.hotelWarning   = '';
      return;
    }
    const cost = hotel.pricePerNight * this.days;
    if (cost > this.breakdown.hotelBudget) {
      this.hotelWarning = `⚠ This hotel exceeds your hotel budget by ${(cost - this.breakdown.hotelBudget).toLocaleString()}LE`;
    } else {
      this.hotelWarning = '';
    }
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
      // deselect
      this.selectedRestaurants = this.selectedRestaurants.filter(x => x.id !== r.id);
      this.restaurantWarning   = '';
      return;
    }
    if (this.selectedRestaurants.length >= this.days) {
      this.restaurantWarning = `⚠ You can select up to ${this.days} restaurant${this.days > 1 ? 's' : ''} for your ${this.days}-day trip.`;
      return;
    }
    this.selectedRestaurants = [...this.selectedRestaurants, r];
    // تحذير لو اقتربنا من الـ limit
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
    // تحقق من الـ budget
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
    return (this.totalBudget ?? 0) - this.totalCost;
  }

  // ════════════════════════════════════════════════════════
  // SAVE / DELETE PLAN
  // ════════════════════════════════════════════════════════

  savePlan(): void {
    const plan: BudgetPlan = {
      id:                   Date.now(),
      totalBudget:          this.totalBudget ?? 0,
      days:                 this.days,
      dailyBudget:          this.dailyBudget,
      selectedHotel:        this.selectedHotel,
      selectedRestaurants:  this.selectedRestaurants,
      selectedAttractions:  this.selectedAttractions,
      totalCost:            this.totalCost,
      createdAt:            new Date().toISOString(),
    };
    this.budgetService.setCurrentPlan(plan);
    this.budgetService.savePlan(plan);
    this.router.navigate(['/budget-planning/details', plan.id]);
  }

  deletePlan(): void {
    // reset كل حاجة
    this.planGenerated       = false;
    this.selectedHotel       = null;
    this.selectedRestaurants = [];
    this.selectedAttractions = [];
    this.totalBudget         = null;
    this.days                = 1;
  }

  // ════════════════════════════════════════════════════════
  // CAROUSEL
  // ════════════════════════════════════════════════════════

  /** اقدر تتحرك؟ */
  canScroll(list: any[], offset: number, dir: 'prev'|'next', visible = 3): boolean {
    return dir === 'next' ? offset + visible < list.length : offset > 0;
  }

  scrollHotels(dir: 'prev'|'next'):      void { this.hotelOffset      = this.scroll(dir, this.hotelOffset,      this.recommendedHotels.length); }
  scrollRestaurants(dir: 'prev'|'next'): void { this.restaurantOffset = this.scroll(dir, this.restaurantOffset, this.recommendedRestaurants.length); }
  scrollAttractions(dir: 'prev'|'next'): void { this.attractionOffset = this.scroll(dir, this.attractionOffset, this.recommendedAttractions.length); }

  private scroll(dir: 'prev'|'next', offset: number, total: number, visible = 3): number {
    if (dir === 'next' && offset + visible < total) return offset + 1;
    if (dir === 'prev' && offset > 0)               return offset - 1;
    return offset;
  }

  /** slice الكروت المرئية */
  visibleHotels():      Hotel[]      { return this.recommendedHotels     .slice(this.hotelOffset,      this.hotelOffset      + 3); }
  visibleRestaurants(): Restaurant[] { return this.recommendedRestaurants.slice(this.restaurantOffset, this.restaurantOffset + 3); }
  visibleAttractions(): Attraction[] { return this.recommendedAttractions.slice(this.attractionOffset, this.attractionOffset + 3); }

  // ── Navigation ────────────────────────────────────────────
  viewHotelDetails(id: number):      void { this.router.navigate(['/hotels/details', id]); }
  viewRestaurantDetails(id: number): void { this.router.navigate(['/restaurant/details', id]); }
  viewAttractionDetails(id: number): void { this.router.navigate(['/tourist-attraction/details', id]); }

  starsArray(n: number): number[] { return Array(n).fill(0); }
}