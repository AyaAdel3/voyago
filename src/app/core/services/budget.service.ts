// ============================================================
// budget.service.ts  →  src/app/core/services/
// كل الـ logic بتاعة الـ Budget Planning
// ============================================================

import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Attraction, BudgetPlan, BudgetBreakdown,
  MOCK_ATTRACTIONS, MOCK_HOTELS, MOCK_RESTAURANTS,
} from '../model/Budget.model';
import { Hotel } from '../model/hotel.model';
import { Restaurant } from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  // ── Current Plan (يتعدي بين صفحة الـ main والـ details) ──
  private currentPlan = signal<BudgetPlan | null>(null);

  // ── Saved Plans ───────────────────────────────────────────
  private savedPlans = signal<BudgetPlan[]>([]);

  // ════════════════════════════════════════════════════════
  // GET DATA — هيتبدل بـ HttpClient لما الـ API يجهز
  // ════════════════════════════════════════════════════════

  getHotels(): Observable<Hotel[]> {
    // TODO: return this.http.get<Hotel[]>('/api/hotels');
    return of(MOCK_HOTELS);
  }

  getRestaurants(): Observable<Restaurant[]> {
    // TODO: return this.http.get<Restaurant[]>('/api/restaurants');
    return of(MOCK_RESTAURANTS);
  }

  getAttractions(): Observable<Attraction[]> {
    // TODO: return this.http.get<Attraction[]>('/api/attractions');
    return of(MOCK_ATTRACTIONS);
  }

  // ════════════════════════════════════════════════════════
  // BUDGET CALCULATION
  // ════════════════════════════════════════════════════════

  /**
   * احسب التوزيع بتاع الـ budget
   * Hotels: 50%, Restaurants: 30%, Attractions: 20%
   */
  calculateBreakdown(totalBudget: number): BudgetBreakdown {
    return {
      hotelBudget:      Math.round(totalBudget * 0.50),
      restaurantBudget: Math.round(totalBudget * 0.30),
      attractionBudget: Math.round(totalBudget * 0.20),
    };
  }

  /**
   * احسب الـ daily budget
   */
  calculateDailyBudget(totalBudget: number, days: number): number {
    return days > 0 ? Math.round(totalBudget / days) : totalBudget;
  }

  /**
   * فلتر الهوتيلات المناسبة للـ budget
   * بتاخد الهوتيلات اللي تكلفتها لـ N nights <= hotelBudget
   */
  getRecommendedHotels(hotels: Hotel[], hotelBudget: number, days: number): Hotel[] {
    return hotels.filter(h => h.pricePerNight * days <= hotelBudget)
                 .sort((a, b) => b.rating - a.rating);
  }

  /**
   * فلتر الريستورانتات المناسبة للـ budget
   */
  getRecommendedRestaurants(restaurants: Restaurant[], restaurantBudget: number): Restaurant[] {
    // TODO: لما الـ API يجيب السعر الحقيقي، فلتر بناءً عليه
    return [...restaurants].sort((a, b) => b.rating - a.rating);
  }

  /**
   * فلتر الـ attractions المناسبة للـ budget
   */
  getRecommendedAttractions(attractions: Attraction[], attractionBudget: number, days: number): Attraction[] {
    const maxAttractions = Math.max(3, Math.floor(days * 0.5));
    return attractions
      .filter(a => a.entryFee <= attractionBudget)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, maxAttractions + 3); // بنعرض أكتر من الـ max عشان اليوزر يختار
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
    // TODO: this.http.post('/api/plans', plan)
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

  /**
   * احسب الـ total cost بناءً على الاختيارات
   */
  calculateTotalCost(
    hotel: Hotel | null,
    restaurants: Restaurant[],
    attractions: Attraction[],
    days: number,
  ): number {
    const hotelCost      = hotel ? hotel.pricePerNight * days : 0;
    const attractionCost = attractions.reduce((s, a) => s + a.entryFee, 0);
    // الريستورانتات مش عندها سعر محدد في الـ mock، بنحسب تقريبي
    const restaurantCost = restaurants.length * 200;
    return hotelCost + restaurantCost + attractionCost;
  }
}