import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  Hotel, Review, RoomType, HotelFeature, HotelFeatureDef, BookingData,
  BookingFeatureDef, FIXED_BOOKING_FEATURES,
  MOCK_HOTELS, MOCK_REVIEWS, MOCK_HOTEL_FEATURES, MOCK_DISPLAY_FEATURES,
  buildDefaultRooms, HotelRoomPrices, HotelApiDetail, HotelApiComment,
  AdminHotelApiItem, AdminHotelsApiResponse,
  AdminHotelReviewsApiResponse, HotelReview,
} from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {

  private readonly apiBase     = 'http://voyagoo.runasp.net/hotels';
  private readonly apiBaseCase = 'http://voyagoo.runasp.net/Hotels';
  private readonly adminApiUrl = 'http://voyagoo.runasp.net/admin/hotels';

  private hotelsSubject  = new BehaviorSubject<Hotel[]>([...MOCK_HOTELS]);
  hotels$                = this.hotelsSubject.asObservable();

  private reviewsSubject = new BehaviorSubject<Review[]>([...MOCK_REVIEWS]);
  reviews$               = this.reviewsSubject.asObservable();

  private favIds         = signal<Set<number>>(new Set());
  private currentBooking = signal<BookingData | null>(null);

  constructor(private http: HttpClient) {}

  getHotels(): Observable<Hotel[]> { return this.hotels$; }

  getHotelById(id: number): Observable<Hotel | undefined> {
    return this.hotels$.pipe(map(hotels => hotels.find(h => h.id === id)));
  }

  getReviews(hotelId: number): Observable<Review[]> {
    return this.reviews$.pipe(
      map(reviews => reviews.filter(r => r.hotelId === hotelId))
    );
  }

  getFeatures(): Observable<HotelFeatureDef[]> {
    return of(MOCK_HOTEL_FEATURES);
  }

  getDisplayFeatures(): Observable<HotelFeatureDef[]> {
    return of(MOCK_DISPLAY_FEATURES);
  }

  getHotelApiById(id: number): Observable<HotelApiDetail> {
    return this.http.get<HotelApiDetail>(`${this.apiBase}/${id}`);
  }

  getAdminHotels(token: string): Observable<AdminHotelsApiResponse> {
    return this.http.get<AdminHotelsApiResponse>(
      `${this.adminApiUrl}/GetAllHotels`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  getComments(hotelId: number): Observable<HotelApiComment[]> {
    return this.http.get<HotelApiDetail>(`${this.apiBase}/${hotelId}`).pipe(
      map(r => r.comments ?? [])
    );
  }

  addComment(hotelId: number, content: string, rating: number): Observable<any> {
    return this.http.post(
      `${this.apiBaseCase}/${hotelId}/comments`,
      { content, rating }
    );
  }

  deleteComment(hotelId: number, commentId: number): Observable<any> {
    return this.http.delete(
      `${this.apiBaseCase}/${hotelId}/comments/${commentId}`
    );
  }

  // ── Admin Hotels ──────────────────────────────────────

  deleteHotelAdmin(hotelId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${hotelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ── Admin Reviews (جديد) ──────────────────────────────

  getAdminReviews(hotelId: number, token: string): Observable<HotelReview[]> {
    return this.http.get<AdminHotelReviewsApiResponse>(
      `${this.adminApiUrl}/${hotelId}/GetAllComments`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => res.comments.map(c => ({
        id:       c.id,
        hotelId:  hotelId,
        userName: c.userName,
        userAvatar: c.profilePictureUrl ?? undefined,
        rating:   c.rating,
        content:  c.content,
        date:     c.createdAt,
      } as HotelReview)))
    );
  }

  deleteReviewAdmin(hotelId: number, commentId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${hotelId}/comments/${commentId}/DeleteComment`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ── WRITE ────────────────────────────────────────────────

  addHotel(hotel: Hotel): void {
    const current = this.hotelsSubject.getValue();
    this.hotelsSubject.next([...current, hotel]);
  }

  updateHotel(updated: Hotel): void {
    const current = this.hotelsSubject.getValue();
    const index   = current.findIndex(h => h.id === updated.id);
    if (index === -1) return;
    const newList  = [...current];
    newList[index] = { ...updated };
    this.hotelsSubject.next(newList);
  }

  deleteHotel(id: number): void {
    const current = this.hotelsSubject.getValue();
    this.hotelsSubject.next(current.filter(h => h.id !== id));
  }

  submitReview(hotelId: number, comment: string, rating: number): Observable<Review> {
    const newReview: Review = {
      id:          Date.now(),
      hotelId,
      userName:    'You',
      userCountry: 'Egypt',
      userAvatar:  '',
      rating,
      comment,
      date:        new Date().toISOString().split('T')[0],
    };
    const current = this.reviewsSubject.getValue();
    this.reviewsSubject.next([newReview, ...current]);
    return of(newReview);
  }

  deleteReview(reviewId: number): void {
    const current = this.reviewsSubject.getValue();
    this.reviewsSubject.next(current.filter(r => r.id !== reviewId));
  }

  isFavorite(id: number): boolean { return this.favIds().has(id); }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

  setBooking(data: BookingData): void  { this.currentBooking.set(data); }
  getBooking(): BookingData | null     { return this.currentBooking(); }

  getDefaultRooms(hotel: Hotel): RoomType[] {
    const prices: HotelRoomPrices = hotel.roomPrices ?? {
      standard: hotel.pricePerNight,
      double:   Math.round(hotel.pricePerNight * 1.5),
      triple:   Math.round(hotel.pricePerNight * 1.8),
      suite:    hotel.pricePerNight * 5,
    };
    return buildDefaultRooms(prices);
  }

  getHotelBookingFeatures(hotel: Hotel): HotelFeature[] {
    const features: BookingFeatureDef[] = hotel.bookingFeatures?.length
      ? hotel.bookingFeatures
      : [...FIXED_BOOKING_FEATURES];

    return features.map(f => ({
      name:     f.name,
      price:    f.price,
      selected: false,
      quantity: 0,
    }));
  }

  getHotelFeatures(hotel: Hotel, allFeatures: HotelFeatureDef[]): HotelFeature[] {
    return this.getHotelBookingFeatures(hotel);
  }

  confirmBooking(booking: BookingData, method: string): Observable<{ bookingId: string }> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand  = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return of({ bookingId: `BK-${rand}` });
  }
}