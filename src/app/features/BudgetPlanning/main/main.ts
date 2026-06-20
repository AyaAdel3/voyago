// ============================================================
// main.ts  →  src/app/features/BudgetPlanning/main/
// صفحة الـ Budget Planning العامة (محتاجة auth):
//   - Input: total budget + days → POST /budget-planning/suggest
//   - Output: hotels/restaurants/attractions كروت مع Add to Plan
//   - Save → POST /budget-planning/save
// ============================================================

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  // ── Input fields ──────────────────────────────────────────
  totalBudget: number | null = null;
  days        = 1;
  inputError  = '';
  isLoading   = false;
  saveError   = '';

  // ── Generated data (من الـ backend) ────────────────────────
  planGenerated = false;
  breakdown!:    BudgetBreakdown;
  dailyBudget    = 0;

  recommendedHotels:      SuggestedHotelItem[]      = [];
  recommendedRestaurants: SuggestedRestaurantItem[] = [];
  recommendedAttractions: SuggestedAttractionItem[] = [];

  // ── User selections ───────────────────────────────────────
  selectedHotel:       SuggestedHotelItem      | null = null;
  selectedRestaurants: SuggestedRestaurantItem[] = [];
  selectedAttractions: SuggestedAttractionItem[] = [];

  // ── Carousel offsets ───────────────────────────────────────
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

  ngOnInit(): void {}

  // ════════════════════════════════════════════════════════
  // AUTH GUARD HELPER
  // ════════════════════════════════════════════════════════

  private requireAuth(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.authModal.openLogin();
      return false;
    }
    return true;
  }

  onBudgetFieldInteraction(event: Event): void {
    if (!this.requireAuth()) {
      (event.target as HTMLInputElement).blur();
    }
  }

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
  // GENERATE PLAN — POST /budget-planning/suggest
  // ════════════════════════════════════════════════════════

  generatePlan(): void {
    if (!this.requireAuth()) return;

    if (!this.totalBudget || this.totalBudget <= 0) {
      this.inputError = 'Please enter a valid total budget.';
      return;
    }
    if (!this.days || this.days <= 0) {
      this.inputError = 'Please enter a valid number of days.';
      return;
    }
    this.inputError = '';
    this.isLoading   = true;

    this.budgetService.suggestPlan(this.totalBudget, this.days).subscribe({
      next: (res: SuggestBudgetPlanResponse) => {
        this.breakdown = {
          hotelBudget:      res.hotelBudget,
          restaurantBudget: res.restaurantBudget,
          attractionBudget: res.attractionBudget,
        };
        this.dailyBudget = this.days > 0 ? Math.round(this.totalBudget! / this.days) : this.totalBudget!;

        this.recommendedHotels      = res.suggestedHotels;
        this.recommendedRestaurants = res.suggestedRestaurants;
        this.recommendedAttractions = res.suggestedAttractions;

        // reset selections
        this.selectedHotel       = null;
        this.selectedRestaurants = [];
        this.selectedAttractions = [];
        this.hotelOffset         = 0;
        this.restaurantOffset    = 0;
        this.attractionOffset    = 0;
        this.hotelWarning        = '';
        this.restaurantWarning   = '';
        this.attractionWarning   = '';

        this.planGenerated = true;
        this.isLoading      = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        // الباك بيرجع BudgetBelowMinimum error لو الميزانية أقل من الحد الأدنى
        this.inputError = err?.error?.message
          ?? '⚠ Your budget is too low for this trip. Please increase it and try again.';
        this.cdr.detectChanges();
      },
    });
  }

  // ════════════════════════════════════════════════════════
  // HOTEL SELECTION — هوتيل واحد بس
  // ════════════════════════════════════════════════════════

  addHotelToPlan(hotel: SuggestedHotelItem): void {
    if (this.selectedHotel?.id === hotel.id) {
      this.selectedHotel = null;
      this.hotelWarning  = '';
      return;
    }
    // الباك أصلاً بيرجع بس الهوتيلات اللي جوه الميزانية، فالتحقق هنا للأمان بس
    this.hotelWarning = hotel.estimatedTotalPrice > this.breakdown.hotelBudget
      ? `⚠ This hotel exceeds your hotel budget by ${(hotel.estimatedTotalPrice - this.breakdown.hotelBudget).toLocaleString()}LE`
      : '';
    this.selectedHotel = hotel;
  }

  isHotelSelected(id: number): boolean {
    return this.selectedHotel?.id === id;
  }

  // ════════════════════════════════════════════════════════
  // RESTAURANT SELECTION — max = days
  // ════════════════════════════════════════════════════════

  addRestaurantToPlan(r: SuggestedRestaurantItem): void {
    const idx = this.selectedRestaurants.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      this.selectedRestaurants = this.selectedRestaurants.filter(x => x.id !== r.id);
      this.restaurantWarning   = '';
      return;
    }
    const newTotal = this.selectedRestaurantsCost + r.estimatedPrice;
    if (newTotal > this.breakdown.restaurantBudget) {
      this.restaurantWarning = `⚠ This restaurant exceeds your restaurants budget.`;
      return;
    }
    this.selectedRestaurants = [...this.selectedRestaurants, r];
    this.restaurantWarning = '';
  }

  isRestaurantSelected(id: number): boolean {
    return this.selectedRestaurants.some(r => r.id === id);
  }

  get selectedRestaurantsCost(): number {
    return this.selectedRestaurants.reduce((s, r) => s + r.estimatedPrice, 0);
  }

  // ════════════════════════════════════════════════════════
  // ATTRACTION SELECTION — max = max(3, days×0.5)
  // ════════════════════════════════════════════════════════

  addAttractionToPlan(a: SuggestedAttractionItem): void {
    const idx = this.selectedAttractions.findIndex(x => x.id === a.id);
    if (idx >= 0) {
      this.selectedAttractions = this.selectedAttractions.filter(x => x.id !== a.id);
      this.attractionWarning   = '';
      return;
    }
    const newCost = this.selectedAttractionsCost + a.ticketPrice;
    if (newCost > this.breakdown.attractionBudget) {
      this.attractionWarning = `⚠ This attraction exceeds your attractions budget.`;
      return;
    }
    this.selectedAttractions = [...this.selectedAttractions, a];
    this.attractionWarning = '';
  }

  isAttractionSelected(id: number): boolean {
    return this.selectedAttractions.some(a => a.id === id);
  }

  get selectedAttractionsCost(): number {
    return this.selectedAttractions.reduce((s, a) => s + a.ticketPrice, 0);
  }

  // ════════════════════════════════════════════════════════
  // TOTAL COST
  // ════════════════════════════════════════════════════════

  get totalCost(): number {
    const hotelCost = this.selectedHotel?.estimatedTotalPrice ?? 0;
    return hotelCost + this.selectedRestaurantsCost + this.selectedAttractionsCost;
  }

  get budgetRemaining(): number {
    return (this.totalBudget ?? 0) - this.totalCost;
  }

  // ════════════════════════════════════════════════════════
  // SAVE PLAN — POST /budget-planning/save
  // ════════════════════════════════════════════════════════

  savePlan(): void {
    if (!this.requireAuth()) return;

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
      totalBudget:    this.totalBudget!,
      numberOfDays:   this.days,
      hotelId:        this.selectedHotel.id,
      restaurantIds:  this.selectedRestaurants.map(r => r.id),
      attractionIds:  this.selectedAttractions.map(a => a.id),
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

  deletePlan(): void {
    this.planGenerated       = false;
    this.selectedHotel       = null;
    this.selectedRestaurants = [];
    this.selectedAttractions = [];
    this.totalBudget         = null;
    this.days                = 1;
    this.saveError           = '';
  }

  // ════════════════════════════════════════════════════════
  // CAROUSEL
  // ════════════════════════════════════════════════════════

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

  visibleHotels():      SuggestedHotelItem[]      { return this.recommendedHotels     .slice(this.hotelOffset,      this.hotelOffset      + 3); }
  visibleRestaurants(): SuggestedRestaurantItem[] { return this.recommendedRestaurants.slice(this.restaurantOffset, this.restaurantOffset + 3); }
  visibleAttractions(): SuggestedAttractionItem[] { return this.recommendedAttractions.slice(this.attractionOffset, this.attractionOffset + 3); }

  // ── Navigation ────────────────────────────────────────────
  viewHotelDetails(id: number):      void { this.router.navigate(['/hotels/details', id]); }
  viewRestaurantDetails(id: number): void { this.router.navigate(['/restaurant/details', id]); }
  viewAttractionDetails(id: number): void { this.router.navigate(['/tourist-attraction/details', id]); }

  starsArray(n: number): number[] { return Array(Math.round(n)).fill(0); }
}