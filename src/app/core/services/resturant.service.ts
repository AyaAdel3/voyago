import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Restaurant, RestaurantReview, TableType, ReservationData,
  MOCK_RESTAURANTS, MOCK_RESTAURANT_REVIEWS, DEFAULT_TABLES,
} from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([...MOCK_RESTAURANTS]);
  restaurants$ = this.restaurantsSubject.asObservable();

  private favIds             = signal<Set<number>>(new Set());
  private currentReservation = signal<ReservationData | null>(null);

  getRestaurants(): Observable<Restaurant[]> {
    return this.restaurants$;
  }

  getRestaurantById(id: number): Observable<Restaurant | undefined> {
    return this.restaurants$.pipe(
      map(list => list.find(r => r.id === id))
    );
  }

  /** cuisine و priceRange يُسحبان من الـ restaurant object مباشرة */
  getRestaurantMeta(id: number): Observable<{ cuisine: string; priceRange: string } | undefined> {
    return this.restaurants$.pipe(
      map(list => {
        const r = list.find(r => r.id === id);
        return r ? { cuisine: r.cuisine, priceRange: r.priceRange } : undefined;
      })
    );
  }

  getReviews(restaurantId: number): Observable<RestaurantReview[]> {
    return new BehaviorSubject<RestaurantReview[]>(
      MOCK_RESTAURANT_REVIEWS.filter(r => r.restaurantId === restaurantId)
    ).asObservable();
  }

  submitReview(restaurantId: number, comment: string, rating: number): Observable<RestaurantReview> {
    const newReview: RestaurantReview = {
      id:           Date.now(),
      restaurantId,
      userName:     'You',
      userCountry:  'Egypt',
      rating,
      comment,
      date:         new Date().toISOString().split('T')[0],
    };
    return new BehaviorSubject(newReview).asObservable();
  }

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

  isFavorite(id: number): boolean   { return this.favIds().has(id); }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

  setReservation(data: ReservationData): void { this.currentReservation.set(data); }
  getReservation(): ReservationData | null     { return this.currentReservation(); }

  getDefaultTables(): TableType[] { return DEFAULT_TABLES.map(t => ({ ...t })); }

  confirmReservation(): Observable<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const rand  = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return new BehaviorSubject(`RES-${rand}`).asObservable();
  }
}