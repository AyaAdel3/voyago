import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Restaurant,
  RestaurantApiResponse,
  RestaurantDetailApiResponse,
  RestaurantReview,
  TableType,
  ReservationData,
  Feature,
  MOCK_RESTAURANT_REVIEWS,
  DEFAULT_TABLES,
  MOCK_FEATURES,
} from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private readonly apiUrl = 'http://voyagoo.runasp.net/Restaurants';

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([]);
  restaurants$ = this.restaurantsSubject.asObservable();

  private reviewsSubject = new BehaviorSubject<RestaurantReview[]>([...MOCK_RESTAURANT_REVIEWS]);
  reviews$ = this.reviewsSubject.asObservable();

  private favIds             = signal<Set<number>>(new Set());
  private currentReservation = signal<ReservationData | null>(null);

  constructor(private http: HttpClient) {
    this.loadRestaurants();
  }

  // ── LOAD LIST FROM API ────────────────────────────────────

  private loadRestaurants(): void {
    this.http.get<RestaurantApiResponse[]>(this.apiUrl).pipe(
      map(apiList => apiList.map(r => this.mapListToRestaurant(r)))
    ).subscribe({
      next: restaurants => this.restaurantsSubject.next(restaurants),
      error: err => console.error('Failed to load restaurants:', err),
    });
  }

  private mapListToRestaurant(r: RestaurantApiResponse): Restaurant {
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

  // ── MAP DETAIL RESPONSE ───────────────────────────────────

  private mapDetailToRestaurant(r: RestaurantDetailApiResponse): Restaurant {
    return {
      id:          r.id,
      name:        r.name,
      description: r.description,
      rating:      r.rating,
      stars:       Math.round(r.rating),
      cuisine:     r.cuisineType,
      minPrice:    r.minPrice,
      maxPrice:    r.maxPrice,
      location:    r.address,
      images:      r.images
                     .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                     .map(img => img.imageUrl),
      features:    r.features,
      featureIds:  r.features.map(f => f.id),
      amenities:   [],
      openTime:    '09:00',
      closeTime:   '23:00',
      status:      'Active',
    };
  }

  // ── READ ─────────────────────────────────────────────────

  getRestaurants(): Observable<Restaurant[]> {
    return this.restaurants$;
  }

  getRestaurantById(id: number): Observable<Restaurant | undefined> {
    return this.http.get<RestaurantDetailApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(r => this.mapDetailToRestaurant(r))
    );
  }

  getRestaurantMeta(id: number): Observable<{ cuisine: string; minPrice: number; maxPrice: number } | undefined> {
    return this.restaurants$.pipe(
      map(list => {
        const r = list.find(r => r.id === id);
        return r ? { cuisine: r.cuisine, minPrice: r.minPrice, maxPrice: r.maxPrice } : undefined;
      })
    );
  }

  getReviews(restaurantId: number): Observable<RestaurantReview[]> {
    return this.http.get<RestaurantDetailApiResponse>(`${this.apiUrl}/${restaurantId}`).pipe(
      map(r => r.comments ?? [])
    );
  }

  getFeatures(): Observable<Feature[]> {
    return of(MOCK_FEATURES);
  }

  submitReview(restaurantId: number, comment: string, rating: number): Observable<RestaurantReview> {
    const body = { content: comment, rating };
    return new Observable(observer => {
      this.http.post(`${this.apiUrl}/${restaurantId}/comments`, body).subscribe({
        next: () => {
          const newReview: RestaurantReview = {
            id:           Date.now(),
            restaurantId,
            userName:     'You',
            userCountry:  'Egypt',
            rating,
            comment,
            date:         new Date().toISOString().split('T')[0],
          };
          observer.next(newReview);
          observer.complete();
        },
        error: err => {
          console.error('Failed to submit review:', err);
          observer.error(err);
        },
      });
    });
  }

  deleteReview(reviewId: number): void {
    const current = this.reviewsSubject.getValue();
    this.reviewsSubject.next(current.filter(r => r.id !== reviewId));
  }

  // ── WRITE ────────────────────────────────────────────────

  addRestaurant(restaurant: Restaurant): void {
    const current = this.restaurantsSubject.getValue();
    this.restaurantsSubject.next([...current, restaurant]);
  }

  updateRestaurant(updated: Restaurant): void {
    const current = this.restaurantsSubject.getValue();
    const index   = current.findIndex(r => r.id === updated.id);
    if (index === -1) return;
    const newList  = [...current];
    newList[index] = { ...updated };
    this.restaurantsSubject.next(newList);
  }

  deleteRestaurant(id: number): void {
    const current = this.restaurantsSubject.getValue();
    this.restaurantsSubject.next(current.filter(r => r.id !== id));
  }

  // ── Favorites ────────────────────────────────────────────

  isFavorite(id: number): boolean { return this.favIds().has(id); }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

  // ── Reservation ──────────────────────────────────────────

  setReservation(data: ReservationData): void {
    this.currentReservation.set(data);
    sessionStorage.setItem('pendingReservation', JSON.stringify(data));
  }

  getReservation(): ReservationData | null {
    const stored = sessionStorage.getItem('pendingReservation');
    if (stored) {
      const data = JSON.parse(stored) as ReservationData;
      this.currentReservation.set(data);
      return data;
    }
    return this.currentReservation();
  }

  getDefaultTables(): TableType[] { return DEFAULT_TABLES.map(t => ({ ...t })); }

  // بتاخد الداتا مباشرة كـ parameter عشان متعتمدش على الـ signal
confirmReservation(data: ReservationData): Observable<string> {
    const getQty = (capacity: number) =>
      data.tables.find(t => t.capacity === capacity)?.quantity ?? 0;

    const body = {
      bookingDate:   data.date,
      guestName:     data.guestName,
      guestPhone:    data.phone,
      tablesForTwo:  getQty(2),
      tablesForFour: getQty(4),
      tablesForSix:  getQty(6),
    };

    return new Observable(observer => {
      this.http.post(`${this.apiUrl}/${data.restaurantId}/bookings`, body).subscribe({
        next: () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const rand  = Array.from({ length: 8 }, () =>
            chars[Math.floor(Math.random() * chars.length)]
          ).join('');
          observer.next(`RES-${rand}`);
          observer.complete();
        },
        error: err => {
          console.error('Booking failed:', err);
          observer.error(err);
        },
      });
    });
  }
}