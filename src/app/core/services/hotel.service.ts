import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Hotel, Review, RoomType, HotelFeature, HotelFeatureDef, BookingData,
  BookingFeatureDef, FIXED_BOOKING_FEATURES,
  MOCK_HOTELS, MOCK_REVIEWS, MOCK_HOTEL_FEATURES, MOCK_DISPLAY_FEATURES,
  buildDefaultRooms, HotelRoomPrices, HotelApiDetail, HotelApiComment,
  AdminHotelApiItem, AdminHotelsApiResponse,
  AdminHotelReviewsApiResponse, HotelReview,
  AdminAddHotelRequest, AdminAddHotelResponse,
  HotelFeatureApiItem, BookingFeatureApiItem,
  CreateBookingRequest, CreateBookingResponse,
} from '../model/hotel.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HotelService {

  private readonly apiBase     = `${environment.apiUrl}/hotels`;
private readonly apiBaseCase = `${environment.apiUrl}/Hotels`;
private readonly adminApiUrl      = `${environment.apiUrl}/admin/hotels`;
private readonly adminFeaturesUrl = `${environment.apiUrl}/admin/hotel-features`;
private readonly adminBookingFeatUrl = `${environment.apiUrl}/admin/booking-features`;
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

  getHotelFeaturesFromApi(token: string): Observable<HotelFeatureDef[]> {
    return this.http
      .get<HotelFeatureApiItem[]>(
        this.adminFeaturesUrl,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .pipe(
        map(items =>
          items.map(item => ({
            id:    item.id,
            name:  item.name,
            icon:  item.icon,
            price: 0,
          } as HotelFeatureDef))
        )
      );
  }

  getBookingFeaturesFromApi(token: string): Observable<BookingFeatureApiItem[]> {
    return this.http.get<BookingFeatureApiItem[]>(
      this.adminBookingFeatUrl,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
      map(r => (r.comments ?? []).map((c: any) => ({
        id:                c.id,
        userName:          c.userName,
        rating:            c.rating,
        content:           c.content,
        date:              c.date ?? c.createdAt,
        profilePictureUrl: c.profilePictureUrl ?? null,
      })))
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

  createBooking(
    hotelId: number,
    payload: CreateBookingRequest,
    token:   string,
  ): Observable<CreateBookingResponse> {
    return this.http.post<CreateBookingResponse>(
      `${this.apiBase}/${hotelId}/bookings`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
      }
    );
  }

  // ── Admin Hotels ──────────────────────────────────────────

  deleteHotelAdmin(hotelId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${hotelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  addHotelAdmin(
    payload: AdminAddHotelRequest,
    images:  string[],
    token:   string
  ): Observable<AdminAddHotelResponse> {
    return this.http.post<AdminAddHotelResponse>(
      this.adminApiUrl,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        }
      }
    );
  }

  updateHotelAdmin(
    hotelId: number,
    payload: AdminAddHotelRequest,
    images:  string[],
    token:   string
  ): Observable<any> {
    return this.http.put(
      `${this.adminApiUrl}/${hotelId}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        }
      }
    );
  }

  updateHotelStatus(hotelId: number, status: string, token: string): Observable<any> {
    return this.http.patch(
      `${this.adminApiUrl}/${hotelId}/status`,
      { status: status.toLowerCase() },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        }
      }
    );
  }

  getAdminHotelById(hotelId: number, token: string): Observable<any> {
    return this.http.get<any>(
      `${this.adminApiUrl}/${hotelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ── Admin Hotel Images ────────────────────────────────────

  uploadHotelImages(hotelId: number, dataUrls: string[], token: string): Observable<any> {
    const formData = new FormData();
    dataUrls.forEach((dataUrl, i) => {
      const blob = this.dataUrlToBlob(dataUrl);
      const ext  = blob.type.split('/')[1] || 'jpg';
      formData.append('images', blob, `image_${Date.now()}_${i}.${ext}`);
    });
    return this.http.post(
      `${this.adminApiUrl}/${hotelId}/images`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  deleteHotelImage(hotelId: number, imageId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${hotelId}/images/${imageId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ── Admin Reviews ─────────────────────────────────────────

  getAdminReviews(hotelId: number, token: string): Observable<HotelReview[]> {
    return this.http.get<AdminHotelReviewsApiResponse>(
      `${this.adminApiUrl}/${hotelId}/GetAllComments`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => res.comments.map(c => ({
        id:         c.id,
        hotelId:    hotelId,
        userName:   c.userName,
        userAvatar: c.profilePictureUrl ?? undefined,
        rating:     c.rating,
        content:    c.content,
        date:       c.createdAt,
      } as HotelReview)))
    );
  }

  deleteReviewAdmin(hotelId: number, commentId: number, token: string): Observable<void> {
    return this.http.delete<void>(
      `${this.adminApiUrl}/${hotelId}/comments/${commentId}/DeleteComment`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ── LOCAL WRITE (mock / optimistic) ──────────────────────

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

  /**
   * POST /hotels/{hotelId}/bookings/{bookingId}/confirm
   * Body: { "paymentType": "card" } or { "paymentType": "cash on arrival" }
   * بيكنفيرم الحجز ويرجع الـ bookingId الكامل للعرض في صفحة التأكيد.
   */
  confirmBooking(
    booking: BookingData,
    method:  'credit' | 'cash',
  ): Observable<{ bookingId: string }> {
    const token       = localStorage.getItem('voyago_token') ?? '';
    const paymentType = method === 'credit' ? 'card' : 'cash on arrival';
    const bookingId   = this.currentBookingId();

    return this.http.post<any>(
      `${this.apiBase}/${booking.hotelId}/bookings/${bookingId}/confirm`,
      { paymentType },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
      }
    ).pipe(
      map(() => ({ bookingId: `MH-${bookingId}` }))
    );
  }

  /**
   * بتحفظ الـ booking ID اللي رجع من createBooking عشان يتستخدم في confirmBooking.
   */
  private bookingIdSignal = signal<number>(0);

  saveBookingId(id: number): void      { this.bookingIdSignal.set(id); }
  currentBookingId(): number           { return this.bookingIdSignal(); }

  // ── Helpers ───────────────────────────────────────────────

  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
}