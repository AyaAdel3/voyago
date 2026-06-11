import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Restaurant,
  RestaurantApiResponse,
  RestaurantDetailApiResponse,
  RestaurantReview,
  TableType,
  ReservationData,
  Feature,
  AdminRestaurantApiItem,
  AdminRestaurantsApiResponse,
  AdminRestaurantAddRequest,
  AdminRestaurantUpdateRequest,
  AdminReviewsApiResponse,
  MOCK_RESTAURANT_REVIEWS,
  DEFAULT_TABLES,
} from '../model/restaurant.model';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private readonly apiUrl      = 'http://voyagoo.runasp.net/Restaurants';
  private readonly adminApiUrl = 'http://voyagoo.runasp.net/admin/restaurants';

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([]);
  restaurants$ = this.restaurantsSubject.asObservable();

  private reviewsSubject = new BehaviorSubject<RestaurantReview[]>([...MOCK_RESTAURANT_REVIEWS]);
  reviews$ = this.reviewsSubject.asObservable();

  private favIds             = signal<Set<number>>(new Set());
  private currentReservation = signal<ReservationData | null>(null);

  constructor(public http: HttpClient) {
    this.loadRestaurants();
  }

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

  // ── GET FEATURES من الـ API ───────────────────────────────
  getFeatures(token: string): Observable<Feature[]> {
    return this.http.get<Feature[]>(
      'http://voyagoo.runasp.net/admin/features',
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getAdminRestaurants(token: string): Observable<AdminRestaurantsApiResponse> {
    return this.http.get<AdminRestaurantsApiResponse>(
      `${this.adminApiUrl}/GetAllRestaurants`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getAdminRestaurantById(id: number, token: string): Observable<RestaurantDetailApiResponse> {
    return this.http.get<RestaurantDetailApiResponse>(
      `${this.adminApiUrl}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getAdminReviews(restaurantId: number, token: string): Observable<RestaurantReview[]> {
    return this.http.get<AdminReviewsApiResponse>(
      `${this.adminApiUrl}/${restaurantId}/GetAllComments`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => res.comments.map(c => ({
        id:           c.id,
        restaurantId: restaurantId,
        userName:     c.userName,
        userCountry:  '',
        userAvatar:   c.profilePictureUrl ?? undefined,
        rating:       c.rating,
        content:      c.content,
        date:         c.createdAt,
      } as RestaurantReview)))
    );
  }

  addRestaurantApi(body: AdminRestaurantAddRequest, token: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      this.adminApiUrl,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  updateRestaurantApi(id: number, body: AdminRestaurantUpdateRequest, token: string): Observable<void> {
    return this.http.put<void>(
      `${this.adminApiUrl}/${id}`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  updateRestaurantStatus(id: number, status: string, token: string): Observable<void> {
    return this.http.patch<void>(
      `${this.adminApiUrl}/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  uploadRestaurantImages(id: number, files: File[], token: string): Observable<void> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<void>(
      `${this.adminApiUrl}/${id}/images`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
            content:      comment,
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

  deleteOwnReview(restaurantId: number, commentId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${restaurantId}/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  deleteReviewAdmin(restaurantId: number, commentId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${restaurantId}/comments/${commentId}/DeleteComment`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  deleteReview(reviewId: number): void {
    const current = this.reviewsSubject.getValue();
    this.reviewsSubject.next(current.filter(r => r.id !== reviewId));
  }

  deleteRestaurant(id: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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

  isFavorite(id: number): boolean { return this.favIds().has(id); }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

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