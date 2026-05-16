import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from './hotel.service';
import { RestaurantService } from './resturant.service';
import { TourGuideService } from './tour-guide.service';

export interface SearchResult {
  id:       number;
  name:     string;
  subtitle: string;
  image:    string;
  type:     'hotel' | 'restaurant' | 'attraction' | 'tourGuide';
  route:    string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {

  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  results$: Observable<SearchResult[]>;

  private openSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.openSubject.asObservable();

  constructor(
    private hotelService:      HotelService,
    private restaurantService: RestaurantService,
    private tourGuideService:  TourGuideService,       // ✅ أضفناه
  ) {
    this.results$ = combineLatest([
      this.query$.pipe(debounceTime(200), distinctUntilChanged()),
      this.hotelService.getHotels(),
      this.restaurantService.getRestaurants(),
      this.tourGuideService.getAll(),                  // ✅ أضفناه
    ]).pipe(
      map(([query, hotels, restaurants, guides]) => {
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

        // ── Tour Guides ───────────────────────────────────  ✅
        guides
          .filter(g =>
            g.name.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .forEach(g => results.push({
            id:       g.id,
            name:     g.name,
            subtitle: `${g.pricePerDay} LE / day`,
            image:    g.profilePictureUrl,
            type:     'tourGuide',
            route:    `/tour-guide`,                   // ✅ بيروح لصفحة التور جايد
          }));

        return results;
      })
    );
  }

  setQuery(query: string): void {
    this.querySubject.next(query);
    this.openSubject.next(query.trim().length > 0);
  }

  close(): void  { this.openSubject.next(false); }
  clear(): void  { this.querySubject.next(''); this.openSubject.next(false); }

  typeLabel(type: SearchResult['type']): string {
    return {
      hotel:       '🏨 Hotel',
      restaurant:  '🍽 Restaurant',
      attraction:  '🏛 Attraction',
      tourGuide:   '🧭 Tour Guide',                    // ✅
    }[type];
  }
}