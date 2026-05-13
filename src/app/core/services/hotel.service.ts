import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Hotel, Review, RoomType, HotelFeature, HotelFeatureDef, BookingData,
  MOCK_HOTELS, MOCK_REVIEWS, MOCK_HOTEL_FEATURES,
  buildDefaultRooms,
} from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {

  private hotelsSubject  = new BehaviorSubject<Hotel[]>([...MOCK_HOTELS]);
  hotels$                = this.hotelsSubject.asObservable();

  private favIds         = signal<Set<number>>(new Set());
  private currentBooking = signal<BookingData | null>(null);

  // ── READ ─────────────────────────────────────────────────

  getHotels(): Observable<Hotel[]> { return this.hotels$; }

  getHotelById(id: number): Observable<Hotel | undefined> {
    return this.hotels$.pipe(map(hotels => hotels.find(h => h.id === id)));
  }

  getReviews(hotelId: number): Observable<Review[]> {
    return new BehaviorSubject<Review[]>(
      MOCK_REVIEWS.filter(r => r.hotelId === hotelId)
    ).asObservable();
  }

  /**
   * Get all available bookable features.
   * TODO: replace of(MOCK_HOTEL_FEATURES) with http.get<HotelFeatureDef[]>('/api/hotel-features')
   */
  getFeatures(): Observable<HotelFeatureDef[]> {
    return of(MOCK_HOTEL_FEATURES);
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

  // ── Reviews ──────────────────────────────────────────────

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
    return new BehaviorSubject(newReview).asObservable();
  }

  // ── Favorites ────────────────────────────────────────────

  isFavorite(id: number): boolean {
    return this.favIds().has(id);
  }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

  // ── Booking ──────────────────────────────────────────────

  setBooking(data: BookingData): void  { this.currentBooking.set(data); }
  getBooking(): BookingData | null     { return this.currentBooking(); }

  /** Rooms priced relative to the hotel's Standard room (pricePerNight) */
  getDefaultRooms(hotel: Hotel): RoomType[] {
    return buildDefaultRooms(hotel.pricePerNight);
  }

  /**
   * Build the widget's feature list for a specific hotel:
   * filter all features by the hotel's featureIds, return with quantity=0
   */
  getHotelFeatures(hotel: Hotel, allFeatures: HotelFeatureDef[]): HotelFeature[] {
    if (!hotel.featureIds?.length) return [];
    return allFeatures
      .filter(f => hotel.featureIds!.includes(f.id))
      .map(f => ({ name: f.name, price: f.price, selected: false, quantity: 0 }));
  }

  confirmBooking(booking: BookingData, method: string): Observable<{ bookingId: string }> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand  = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return new BehaviorSubject({ bookingId: `BK-${rand}` }).asObservable();
  }
}