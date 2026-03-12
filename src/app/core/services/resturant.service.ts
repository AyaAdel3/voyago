// ============================================================
// restaurant.service.ts  →  src/app/core/services/
// كل الـ data logic بتاعة الريستورنت
// ============================================================

import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Restaurant, RestaurantReview, TableType, ReservationData,
  MOCK_RESTAURANTS, MOCK_RESTAURANT_REVIEWS, DEFAULT_TABLES,
} from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  // ── Favorites (signal عشان reactivity) ───────────────────
  private favIds = signal<Set<number>>(new Set());

  // ── Current Reservation (يتعدي بين الصفحات) ──────────────
  private currentReservation = signal<ReservationData | null>(null);

  // ════════════════════════════════════════════════════════
  // GET METHODS — هيتبدلوا بـ HttpClient.get() لما الـ API يجهز
  // ════════════════════════════════════════════════════════

  /** جيب كل الريستورانتات */
  getRestaurants(): Observable<Restaurant[]> {
    // TODO: return this.http.get<Restaurant[]>('/api/restaurants');
    return of(MOCK_RESTAURANTS);
  }

  /** جيب ريستورانت واحد بالـ ID */
  getRestaurantById(id: number): Observable<Restaurant | undefined> {
    // TODO: return this.http.get<Restaurant>(`/api/restaurants/${id}`);
    return of(MOCK_RESTAURANTS.find(r => r.id === id));
  }

  /** جيب الريفيوز بتاعة ريستورانت معين */
  getReviews(restaurantId: number): Observable<RestaurantReview[]> {
    // TODO: return this.http.get<RestaurantReview[]>(`/api/restaurants/${restaurantId}/reviews`);
    return of(MOCK_RESTAURANT_REVIEWS.filter(r => r.restaurantId === restaurantId));
  }

  /** ابعت ريفيو جديد */
  submitReview(restaurantId: number, comment: string, rating: number): Observable<RestaurantReview> {
    // TODO: return this.http.post<RestaurantReview>(`/api/restaurants/${restaurantId}/reviews`, { comment, rating });
    const newReview: RestaurantReview = {
      id:           Date.now(),
      restaurantId,
      userName:     'You',
      userCountry:  'Egypt',
      rating,
      comment,
      date:         new Date().toISOString().split('T')[0],
    };
    return of(newReview);
  }

  // ════════════════════════════════════════════════════════
  // FAVORITES
  // ════════════════════════════════════════════════════════

  isFavorite(id: number): boolean {
    return this.favIds().has(id);
  }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

  // ════════════════════════════════════════════════════════
  // RESERVATION — يتحفظ ويتجاب بين صفحة الديتيلز والريزرفيشن
  // ════════════════════════════════════════════════════════

  setReservation(data: ReservationData): void {
    this.currentReservation.set(data);
  }

  getReservation(): ReservationData | null {
    return this.currentReservation();
  }

  /** نسخة من الـ tables الافتراضية (مهم: نسخة جديدة مش reference) */
  getDefaultTables(): TableType[] {
    return DEFAULT_TABLES.map(t => ({ ...t }));
  }

  /** Confirm الحجز وارجع confirmation number */
  confirmReservation(): Observable<string> {
    // TODO: return this.http.post<{confirmationNumber: string}>('/api/reservations', this.currentReservation()).pipe(map(r => r.confirmationNumber));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rand  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return of(`RES-${rand}`);
  }
}