// ============================================================
// plan.ts  →  src/app/features/BudgetPlanning/plan/
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { Restaurant } from '../../../core/model/restaurant.model';
import { Attraction, BudgetBreakdown, BudgetPlan } from '../../../core/model/Budget.model';
import { BudgetService } from '../../../core/services/budget.service';
import { PlanService } from '../../../core/services/plan.service';

@Component({
  selector: 'app-budget-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.html',
  styleUrl: './plan.css',
})
export class Plan implements OnInit {

  totalBudget = 0;
  days = 1;
  inputError = '';
  planGenerated = false;
  breakdown!: BudgetBreakdown;
  dailyBudget = 0;

  allHotels: Hotel[] = [];
  allRestaurants: Restaurant[] = [];
  allAttractions: Attraction[] = [];

  recommendedHotels: Hotel[] = [];
  availableRestaurants: Restaurant[] = [];
  availableAttractions: Attraction[] = [];

  selectedHotel: Hotel | null = null;
  selectedRestaurants: Restaurant[] = [];
  selectedAttractions: Attraction[] = [];

  // ── Hotel Slider ──────────────────────────────────────────
  hotelIndex = 0;
  readonly HOTELS_VISIBLE = 3;

  hotelWarning = '';
  restaurantWarning = '';
  attractionWarning = '';

  minRequiredBudget = 0;

  readonly RESTAURANT_COST = 150;

  constructor(
    private budgetService: BudgetService,
    private planService: PlanService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.budgetService.getHotels().subscribe(h => {
      this.allHotels = h;
      this.recalcMinBudget();
    });

    this.budgetService.getRestaurants().subscribe(r => {
      this.allRestaurants = r;
    });

    this.budgetService.getAttractions().subscribe(a => {
      this.allAttractions = a;
      this.recalcMinBudget();
    });
  }

  private recalcMinBudget(): void {
    if (!this.allHotels.length) return;
    const cheapestHotel = Math.min(...this.allHotels.map(h => h.pricePerNight));
    this.minRequiredBudget = Math.ceil((cheapestHotel * this.days) / 0.50);
  }

  onDaysChange(): void {
    this.recalcMinBudget();
    if (this.planGenerated) this.resetPlan();
    if (this.inputError) this.inputError = '';
  }

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

    this.breakdown = this.budgetService.calculateBreakdown(this.totalBudget);
    this.dailyBudget = this.budgetService.calculateDailyBudget(this.totalBudget, this.days);

    const hotelsInBudget = this.allHotels
      .filter(h => h.pricePerNight * this.days <= this.breakdown.hotelBudget)
      .sort((a, b) => b.rating - a.rating);

    this.recommendedHotels = hotelsInBudget.length > 0
      ? hotelsInBudget
      : [...this.allHotels].sort((a, b) => a.pricePerNight - b.pricePerNight);

    this.availableRestaurants = [...this.allRestaurants].sort((a, b) => b.rating - a.rating);

    this.availableAttractions = this.allAttractions
      .filter(a => a.entryFee <= this.breakdown.attractionBudget)
      .sort((a, b) => b.rating - a.rating);

    this.selectedHotel = null;
    this.selectedRestaurants = [];
    this.selectedAttractions = [];

    this.hotelIndex = 0;
    this.hotelWarning = '';
    this.restaurantWarning = '';
    this.attractionWarning = '';

    this.planGenerated = true;
    this.cdr.detectChanges();
  }

  // ── Hotel Slider Methods ──────────────────────────────────

  visibleHotels(): Hotel[] {
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

  addHotelToPlan(hotel: Hotel): void {
    if (this.selectedHotel?.id === hotel.id) {
      this.selectedHotel = null;
      this.hotelWarning = '';
      return;
    }

    const cost = hotel.pricePerNight * this.days;

    this.hotelWarning = cost > this.breakdown.hotelBudget
      ? `⚠ Exceeds hotel budget by ${(cost - this.breakdown.hotelBudget).toLocaleString()}LE`
      : '';

    this.selectedHotel = hotel;
  }

  isHotelSelected(id: number): boolean {
    return this.selectedHotel?.id === id;
  }

  // ── Restaurants ───────────────────────────────────────────

  get restaurantBudgetUsed(): number {
    return this.selectedRestaurants.length * this.RESTAURANT_COST * this.days;
  }

  get restaurantBudgetRemaining(): number {
    return this.breakdown
      ? this.breakdown.restaurantBudget - this.restaurantBudgetUsed
      : 0;
  }

  addRestaurantToPlan(r: Restaurant): void {
    const exists = this.selectedRestaurants.find(x => x.id === r.id);

    if (exists) {
      this.selectedRestaurants = this.selectedRestaurants.filter(x => x.id !== r.id);
      this.restaurantWarning = '';
      return;
    }

    const addedCost = this.RESTAURANT_COST * this.days;

    if (this.restaurantBudgetUsed + addedCost > this.breakdown.restaurantBudget) {
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
    return this.selectedAttractions.reduce((s, a) => s + a.entryFee, 0);
  }

  get attractionBudgetRemaining(): number {
    return this.breakdown
      ? this.breakdown.attractionBudget - this.selectedAttractionsCost
      : 0;
  }

  addAttractionToPlan(a: Attraction): void {
    const exists = this.selectedAttractions.find(x => x.id === a.id);

    if (exists) {
      this.selectedAttractions = this.selectedAttractions.filter(x => x.id !== a.id);
      this.attractionWarning = '';
      return;
    }

    if (this.selectedAttractionsCost + a.entryFee > this.breakdown.attractionBudget) {
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
    return this.budgetService.calculateTotalCost(
      this.selectedHotel,
      this.selectedRestaurants,
      this.selectedAttractions,
      this.days
    );
  }

  get budgetRemaining(): number {
    return this.totalBudget - this.totalCost;
  }

  // ── Save Plan ─────────────────────────────────────────────

  savePlan(): void {
    const savedPlan = {
      id: crypto.randomUUID(),
      name: this.generatePlanName(),
      hotel: this.selectedHotel,
      restaurants: this.selectedRestaurants,
      attractions: this.selectedAttractions,
      totalCost: this.totalCost
    };

    this.planService.savePlan(savedPlan);
    this.router.navigate(['/profile/saved-plan']);
  }

  private generatePlanName(): string {
    return `Trip (${this.days} days) - ${this.totalCost} EGP`;
  }

  // ── Reset ─────────────────────────────────────────────────

  deletePlan(): void {
    this.resetPlan();
    this.totalBudget = 0;
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
  }

  // ── Navigation ────────────────────────────────────────────

  viewHotelDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  viewRestaurantDetails(id: number): void {
    this.router.navigate(['/Restaurants/details', id]);
  }

  viewAttractionDetails(id: number): void {
    this.router.navigate(['/Attractions/details', id]);
  }

  starsArray(n: number): number[] {
    return Array(n).fill(0);
  }
}