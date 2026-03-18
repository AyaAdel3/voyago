// ============================================================
// search.service.ts  →  src/app/core/services/
// بيسرش في كل حاجة في السايت: هوتيلات، ريستورانتات، attractions
// ============================================================

import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from './hotel.service';
import { RestaurantService } from './resturant.service';

export interface SearchResult {
  id:       number;
  name:     string;
  subtitle: string;   // location أو cuisine أو category
  image:    string;
  type:     'hotel' | 'restaurant' | 'attraction';
  route:    string;   // الـ route اللي هيروح عليها
}

@Injectable({ providedIn: 'root' })
export class SearchService {

  // ── الـ query اللي اليوزر بيكتبه ─────────────────────────
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  // ── النتايج ───────────────────────────────────────────────
  results$: Observable<SearchResult[]>;

  // ── هل الـ dropdown مفتوح ─────────────────────────────────
  private openSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.openSubject.asObservable();

  constructor(
    private hotelService:      HotelService,
    private restaurantService: RestaurantService,
  ) {
    // جمع كل البيانات في observable واحد
    this.results$ = combineLatest([
      this.query$.pipe(debounceTime(200), distinctUntilChanged()),
      this.hotelService.getHotels(),
      this.restaurantService.getRestaurants(),
    ]).pipe(
      map(([query, hotels, restaurants]) => {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 1) return [];

        const results: SearchResult[] = [];

        // ── Hotels ────────────────────────────────────────
        hotels
          .filter(h =>
            h.name.toLowerCase().includes(q) ||
            h.location.toLowerCase().includes(q) ||
            h.description.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .forEach(h => results.push({
            id:       h.id,
            name:     h.name,
            subtitle: h.location,
            image:    h.images[0],
            type:     'hotel',
            route:    `/hotels/details/${h.id}`,
          }));

        // ── Restaurants ───────────────────────────────────
        restaurants
          .filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            r.location.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .forEach(r => results.push({
            id:       r.id,
            name:     r.name,
            subtitle: r.cuisine,
            image:    r.images[0],
            type:     'restaurant',
            route:    `/restaurant/details/${r.id}`,
          }));

        return results;
      })
    );
  }

  // ── Update query ──────────────────────────────────────────
  setQuery(query: string): void {
    this.querySubject.next(query);
    this.openSubject.next(query.trim().length > 0);
  }

  // ── Close dropdown ────────────────────────────────────────
  close(): void {
    this.openSubject.next(false);
  }

  // ── Clear ─────────────────────────────────────────────────
  clear(): void {
    this.querySubject.next('');
    this.openSubject.next(false);
  }

  // ── Type label للعرض ──────────────────────────────────────
  typeLabel(type: SearchResult['type']): string {
    return { hotel: '🏨 Hotel', restaurant: '🍽 Restaurant', attraction: '🏛 Attraction' }[type];
  }
}