import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Hotel, Review, RoomType, HotelFeature, BookingData,
  MOCK_HOTELS, MOCK_REVIEWS, DEFAULT_ROOMS, DEFAULT_FEATURES,
} from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {

  // ── Reactive hotels store ────────────────────────────────
  private hotelsSubject = new BehaviorSubject<Hotel[]>([...MOCK_HOTELS]);
  hotels$ = this.hotelsSubject.asObservable();

  // ── Signals ──────────────────────────────────────────────
  private favIds         = signal<Set<number>>(new Set());
  private currentBooking = signal<BookingData | null>(null);

  // ── READ ─────────────────────────────────────────────────

  getHotels(): Observable<Hotel[]> {
    return this.hotels$;
  }

  getHotelById(id: number): Observable<Hotel | undefined> {
    return this.hotels$.pipe(
      map(hotels => hotels.find(h => h.id === id))
    );
  }

  getReviews(hotelId: number): Observable<Review[]> {
    return new BehaviorSubject<Review[]>(
      MOCK_REVIEWS.filter(r => r.hotelId === hotelId)
    ).asObservable();
  }

  // ── WRITE ────────────────────────────────────────────────

  /** إضافة هوتل جديد */
  addHotel(hotel: Hotel): void {
    const current = this.hotelsSubject.getValue();
    this.hotelsSubject.next([...current, hotel]);
  }

  /** تحديث هوتل موجود */
  updateHotel(updated: Hotel): void {
    const current = this.hotelsSubject.getValue();
    const index   = current.findIndex(h => h.id === updated.id);
    if (index === -1) return;
    const newList  = [...current];
    newList[index] = { ...updated };
    this.hotelsSubject.next(newList);
  }

  /** حذف هوتل */
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

  setBooking(data: BookingData): void {
    this.currentBooking.set(data);
  }

  getBooking(): BookingData | null {
    return this.currentBooking();
  }

  getDefaultRooms(): RoomType[] {
    return DEFAULT_ROOMS.map(r => ({ ...r }));
  }

  getDefaultFeatures(): HotelFeature[] {
    return DEFAULT_FEATURES.map(f => ({ ...f }));
  }

  confirmBooking(booking: BookingData, method: string): Observable<{ bookingId: string }> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand  = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return new BehaviorSubject({ bookingId: `BK-${rand}` }).asObservable();
  }
}