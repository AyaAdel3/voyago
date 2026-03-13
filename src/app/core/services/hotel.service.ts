import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Hotel, Review, RoomType, HotelFeature, BookingData,
  MOCK_HOTELS, MOCK_REVIEWS, DEFAULT_ROOMS, DEFAULT_FEATURES,
} from '../model/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {

  private favIds = signal<Set<number>>(new Set());
  private currentBooking = signal<BookingData | null>(null);

  getHotels(): Observable<Hotel[]> {
    return of(MOCK_HOTELS);
  }

  getHotelById(id: number): Observable<Hotel | undefined> {
    return of(MOCK_HOTELS.find(h => h.id === id));
  }

  getReviews(hotelId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.hotelId === hotelId));
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
    return of(newReview);
  }

  isFavorite(id: number): boolean {
    return this.favIds().has(id);
  }

  toggleFavorite(id: number): void {
    const current = new Set(this.favIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.favIds.set(current);
  }

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
    const rand  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return of({ bookingId: `BK-${rand}` });
  }
}