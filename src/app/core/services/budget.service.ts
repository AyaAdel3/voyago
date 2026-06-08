// ============================================================
// budget.service.ts  →  src/app/core/services/
// كل الـ logic بتاعة الـ Budget Planning
// ============================================================

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Attraction, BudgetPlan, BudgetBreakdown,
  MOCK_ATTRACTIONS, MOCK_HOTELS,
} from '../model/Budget.model';
import { Hotel } from '../model/hotel.model';
import { Restaurant, RestaurantApiResponse } from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private readonly restaurantsApiUrl = 'http://voyagoo.runasp.net/Restaurants';

  // ── Current Plan (يتعدي بين صفحة الـ main والـ details) ──
  private currentPlan = signal<BudgetPlan | null>(null);

  // ── Saved Plans ───────────────────────────────────────────
  private savedPlans = signal<BudgetPlan[]>([]);

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════
  // GET DATA
  // ════════════════════════════════════════════════════════

  getHotels(): Observable<Hotel[]> {
    return of(MOCK_HOTELS);
  }

  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<RestaurantApiResponse[]>(this.restaurantsApiUrl).pipe(
      map(apiList => apiList.map(r => this.mapToRestaurant(r)))
    );
  }

  private mapToRestaurant(r: RestaurantApiResponse): Restaurant {
    return {
      id:          r.id,
      name:        r.name,
      description: r.description,
      rating:      r.rating,
      stars:       Math.round(r.rating),
      cuisine:     r.cuisineType,
      minPrice:    r.minPrice,
      maxPrice:    r.maxPrice,
      location:    'Fayoum, Egypt',
      images:      [r.mainImageUrl],
      amenities:   [],
      openTime:    '09:00',
      closeTime:   '23:00',
      status:      'Active',
    };
  }

  getAttractions(): Observable<Attraction[]> {
    return of(MOCK_ATTRACTIONS);
  }

  // ════════════════════════════════════════════════════════
  // BUDGET CALCULATION
  // ════════════════════════════════════════════════════════

  calculateBreakdown(totalBudget: number): BudgetBreakdown {
    return {
      hotelBudget:      Math.round(totalBudget * 0.50),
      restaurantBudget: Math.round(totalBudget * 0.30),
      attractionBudget: Math.round(totalBudget * 0.20),
    };
  }

  calculateDailyBudget(totalBudget: number, days: number): number {
    return days > 0 ? Math.round(totalBudget / days) : totalBudget;
  }

  getRecommendedHotels(hotels: Hotel[], hotelBudget: number, days: number): Hotel[] {
    return hotels.filter(h => h.pricePerNight * days <= hotelBudget)
                 .sort((a, b) => b.rating - a.rating);
  }

  getRecommendedRestaurants(restaurants: Restaurant[], restaurantBudget: number): Restaurant[] {
    return [...restaurants].sort((a, b) => b.rating - a.rating);
  }

  getRecommendedAttractions(attractions: Attraction[], attractionBudget: number, days: number): Attraction[] {
    const maxAttractions = Math.max(3, Math.floor(days * 0.5));
    return attractions
      .filter(a => a.entryFee <= attractionBudget)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, maxAttractions + 3);
  }

  // ════════════════════════════════════════════════════════
  // PLAN MANAGEMENT
  // ════════════════════════════════════════════════════════

  setCurrentPlan(plan: BudgetPlan): void {
    this.currentPlan.set(plan);
  }

  getCurrentPlan(): BudgetPlan | null {
    return this.currentPlan();
  }

  savePlan(plan: BudgetPlan): void {
    const plans = [...this.savedPlans()];
    const existingIdx = plans.findIndex(p => p.id === plan.id);
    if (existingIdx >= 0) {
      plans[existingIdx] = plan;
    } else {
      plans.push({ ...plan, id: Date.now() });
    }
    this.savedPlans.set(plans);
  }

  getSavedPlans(): BudgetPlan[] {
    return this.savedPlans();
  }

  deletePlan(id: number): void {
    this.savedPlans.set(this.savedPlans().filter(p => p.id !== id));
  }

  calculateTotalCost(
    hotel: Hotel | null,
    restaurants: Restaurant[],
    attractions: Attraction[],
    days: number,
  ): number {
    const hotelCost      = hotel ? hotel.pricePerNight * days : 0;
    const attractionCost = attractions.reduce((s, a) => s + a.entryFee, 0);
    const restaurantCost = restaurants.length * 200;
    return hotelCost + restaurantCost + attractionCost;
  }
}