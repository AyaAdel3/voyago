import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  Attraction, BudgetPlan, BudgetBreakdown,
} from '../model/Budget.model';
import { Hotel } from '../model/hotel.model';
import { Restaurant, RestaurantApiResponse } from '../model/restaurant.model';
import {
  AttractionService,
  Attraction as ApiAttraction,
} from './attraction.service';

export interface HotelApiItem {
  id:           number;
  name:         string;
  description:  string;
  location:     string;
  rating:       number;
  minPrice:     number;
  maxPrice:     number;
  mainImageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private readonly hotelsApiUrl      = 'http://voyagoo.runasp.net/hotels';
  private readonly restaurantsApiUrl = 'http://voyagoo.runasp.net/Restaurants';

  private currentPlan = signal<BudgetPlan | null>(null);
  private savedPlans  = signal<BudgetPlan[]>([]);

  constructor(
    private http:              HttpClient,
    private attractionService: AttractionService,
  ) {}

  // ════════════════════════════════════════════════════════
  // GET DATA
  // ════════════════════════════════════════════════════════

  getHotels(): Observable<Hotel[]> {
    return this.http.get<HotelApiItem[]>(this.hotelsApiUrl).pipe(
      map(apiList => apiList.map(h => this.mapToHotel(h)))
    );
  }

  private mapToHotel(h: HotelApiItem): Hotel {
    return {
      id:            h.id,
      name:          h.name,
      description:   h.description,
      location:      h.location,
      rating:        h.rating,
      stars:         Math.round(h.rating),
      pricePerNight: h.minPrice,
      amenities:     [],
      images:        [h.mainImageUrl],
      status:        'Active',
    };
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

  // ✅ بتجيب الـ list الأول، وبعدين لكل واحدة تجيب التفاصيل عشان ticketPrice
  getAttractions(): Observable<Attraction[]> {
    return this.attractionService.getAll().pipe(
      switchMap(list => {
        if (!list.length) return of([]);

        // forkJoin بيبعت كل الـ requests مع بعض (parallel)
        return forkJoin(
          list.map(a =>
            this.attractionService.getById(a.id).pipe(
              map(details => ({
                id:          details.id,
                name:        details.name,
                description: details.description,
                rating:      details.rating,
                category:    details.category,
                entryFee:    details.ticketPrice ?? 0,
                location:    details.location ?? 'Fayoum, Egypt',
                images:      details.images?.length
                               ? [details.images.find(i => i.isMain)?.imageUrl ?? details.images[0].imageUrl]
                               : [a.mainImageUrl ?? ''],
              } as Attraction))
            )
          )
        );
      })
    );
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
    return hotels
      .filter(h => h.pricePerNight * days <= hotelBudget)
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
    hotel:       Hotel      | null,
    restaurants: Restaurant[],
    attractions: Attraction[],
    days:        number,
  ): number {
    const hotelCost      = hotel ? hotel.pricePerNight * days : 0;
    const attractionCost = attractions.reduce((s, a) => s + a.entryFee, 0);
    const restaurantCost = restaurants.length * 200;
    return hotelCost + restaurantCost + attractionCost;
  }
}