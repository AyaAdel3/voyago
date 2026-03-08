import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, shareReplay } from 'rxjs';
import {
  Hotel, Review, BookingData,
  MOCK_HOTELS, MOCK_REVIEWS,
  DEFAULT_ROOMS, DEFAULT_FEATURES,
  RoomType, HotelFeature,
} from '../model/hotel.model';

const API_BASE = 'https://your-api.com/api';

@Injectable({ providedIn: 'root' })
export class HotelService {

  private favIds = signal<number[]>([]);
  private currentBooking = signal<BookingData | null>(null);

  // ✅ الـ fix: بنحط shareReplay عشان لو في أكتر من subscriber
  getHotels(): Observable<Hotel[]> {
    return of([...MOCK_HOTELS]).pipe(delay(500), shareReplay(1));
  }

  getHotelById(id: number): Observable<Hotel | undefined> {
    return of(MOCK_HOTELS.find(h => h.id === id)).pipe(delay(300));
  }

  getReviews(hotelId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.hotelId === hotelId)).pipe(delay(300));
  }

  submitReview(hotelId: number, comment: string, rating: number): Observable<Review> {
    const review: Review = {
      id: Date.now(), hotelId,
      userName: 'Current User',
      userAvatar: '', userCountry: 'Egypt',
      rating, comment,
      date: new Date().toISOString().split('T')[0],
    };
    return of(review).pipe(delay(500));
  }

  toggleFavorite(hotelId: number): void {
    const cur = this.favIds();
    this.favIds.set(
      cur.includes(hotelId) ? cur.filter(id => id !== hotelId) : [...cur, hotelId]
    );
  }

  isFavorite(hotelId: number): boolean {
    return this.favIds().includes(hotelId);
  }

  setBooking(data: BookingData): void { this.currentBooking.set(data); }
  getBooking(): BookingData | null    { return this.currentBooking(); }

  confirmBooking(bookingData: BookingData, paymentMethod: string): Observable<{ bookingId: string }> {
    const bookingId = `MH-${new Date().getFullYear()}-${rand4()}-${rand4()}`;
    return of({ bookingId }).pipe(delay(1000));
  }

  getDefaultRooms():    RoomType[]     { return DEFAULT_ROOMS.map(r => ({ ...r })); }
  getDefaultFeatures(): HotelFeature[] { return DEFAULT_FEATURES.map(f => ({ ...f })); }
}

function rand4() { return String(Math.floor(Math.random() * 9999)).padStart(4, '0'); }