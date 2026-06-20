// ============================================================
// main.ts  →  src/app/features/BudgetPlanning/main/
// صفحة الـ Budget Planning العامة (محتاجة auth):
//   - Input: total budget + days → POST /budget-planning/suggest
//   - Output: hotels/restaurants/attractions كروت مع Add to Plan
//   - Save → POST /budget-planning/save
//   - السلايدر هنا بقى صفحة كاملة (pageSize) بدل offset، بالظبط
//     زي details.ts (نفس breakpoints: 900px و 540px)
// ============================================================

import { Component, OnInit, ChangeDetectorRef, HostListener, inject } from '@angular/core';
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

  // ── Slider state — حجم الصفحة بيتغير حسب عرض الشاشة ──────
  // Desktop (>900px): 3 كاردز فالصفحة
  // Tablet  (541–900px): 2 كاردز فالصفحة
  // Mobile  (<=540px): كارد واحد فالصفحة
  // (لازم يطابق breakpoints main.css: 900px و 540px — نفس details)
  pageSize = 3;

  hotelPage      = 0;
  restaurantPage = 0;
  attractionPage = 0;

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
    this.updatePageSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    const prevPageSize = this.pageSize;
    this.updatePageSize();

    // لو حجم الصفحة تغيّر، رجّع المؤشر لأول صفحة عشان نتجنب
    // صفحة فاضية بعد تغيير عدد العناصر بالصفحة
    if (prevPageSize !== this.pageSize) {
      this.hotelPage      = 0;
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
        this.hotelPage           = 0;
        this.restaurantPage      = 0;
        this.attractionPage      = 0;
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
  // RESTAURANT SELECTION
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
  // ATTRACTION SELECTION
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
  // SLIDER — Hotels (صفحات بحجم pageSize، نفس نظام details)
  // ════════════════════════════════════════════════════════

  get hotelPageCount(): number {
    return Math.ceil(this.recommendedHotels.length / this.pageSize);
  }

  visibleHotels(): SuggestedHotelItem[] {
    const start = this.hotelPage * this.pageSize;
    return this.recommendedHotels.slice(start, start + this.pageSize);
  }

  nextHotelPage(): void {
    const total = this.hotelPageCount;
    if (total <= 1) return;
    this.hotelPage = (this.hotelPage + 1) % total;
  }

  prevHotelPage(): void {
    const total = this.hotelPageCount;
    if (total <= 1) return;
    this.hotelPage = (this.hotelPage - 1 + total) % total;
  }

  goToHotelPage(i: number): void {
    this.hotelPage = i;
  }

  hotelPages(): number[] {
    return Array.from({ length: this.hotelPageCount }, (_, i) => i);
  }

  // ════════════════════════════════════════════════════════
  // SLIDER — Restaurants
  // ════════════════════════════════════════════════════════

  get restaurantPageCount(): number {
    return Math.ceil(this.recommendedRestaurants.length / this.pageSize);
  }

  visibleRestaurants(): SuggestedRestaurantItem[] {
    const start = this.restaurantPage * this.pageSize;
    return this.recommendedRestaurants.slice(start, start + this.pageSize);
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

  // ════════════════════════════════════════════════════════
  // SLIDER — Attractions
  // ════════════════════════════════════════════════════════

  get attractionPageCount(): number {
    return Math.ceil(this.recommendedAttractions.length / this.pageSize);
  }

  visibleAttractions(): SuggestedAttractionItem[] {
    const start = this.attractionPage * this.pageSize;
    return this.recommendedAttractions.slice(start, start + this.pageSize);
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

  // ── Navigation ────────────────────────────────────────────
  viewHotelDetails(id: number):      void { this.router.navigate(['/hotels/details', id]); }
  viewRestaurantDetails(id: number): void { this.router.navigate(['/restaurant/details', id]); }
  viewAttractionDetails(id: number): void { this.router.navigate(['/tourist-attraction/details', id]); }

  starsArray(n: number): number[] { return Array(Math.round(n)).fill(0); }
}