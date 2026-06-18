// my-bookings.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
/* ── Shared shape: hotel rooms & restaurant tables ─────────── */
export interface BookingRoom {
  type:     string;
  quantity: number;
  price:    number;
}

/* ── Fields shared by every booking type ──────────────────── */
interface BaseBookingItem {
  bookingId:    string;   // string مع prefix للعرض  e.g. "MH-29"
  rawBookingId: number;   // الـ numeric ID الأصلي للـ API calls
  totalAmount:  number;
  status:       'confirmed' | 'pending';
  createdAt?:   string;
}

/* ── Hotel booking ─────────────────────────────────────────── */
export interface HotelBookingItem extends BaseBookingItem {
  bookingType:    'hotel';
  hotelName:      string;
  hotelImage?:    string;
  checkIn:        string;
  checkOut:       string;
  totalNights:    number;
  rooms:          BookingRoom[];
  serviceCharge:  number;
  discount:       number;
  discountAmount: number;
  paymentMethod:  'credit' | 'cash';
}

/* ── Tour guide booking ────────────────────────────────────── */
export interface TourGuideBookingItem extends BaseBookingItem {
  bookingType:   'tourguide';
  guideName:     string;
  guideImage?:   string;
  date:          string;
  days:          number;
  pricePerDay?:  number;
  paymentMethod: 'credit' | 'cash';
}

/* ── Restaurant reservation ───────────────────────────────── */
export interface RestaurantBookingItem extends BaseBookingItem {
  bookingType:       'restaurant';
  restaurantName:    string;
  restaurantImage?:  string;
  restaurantAddress: string;
  date:              string;
  guestName:         string;
  phone:             string;
  tables:            BookingRoom[];
}

export type MyBookingItem =
  | HotelBookingItem
  | TourGuideBookingItem
  | RestaurantBookingItem;

type FilterStatus = 'all' | 'confirmed' | 'pending';

/* ── سكشن واحد من الـ 3 (Hotels / Restaurants / Tour Guides) ── */
interface BookingSection {
  key:   'hotel' | 'restaurant' | 'tourguide';
  label: string;
  icon:  string;
  items: MyBookingItem[];
}

/* ── شكل الـ API response ─────────────────────────────────── */
interface ApiHotelBooking {
  bookingId:    number;
  hotelName:    string;
  checkIn:      string;
  checkOut:     string;
  nights:       number;
  totalPrice:   number;
  paymentType:  string;
  status:       string;
  createdAt:    string;
  mainImageUrl: string;
}

interface ApiTourGuideBooking {
  bookingId:         number;
  tourGuideName:     string;
  bookingDate:       string;
  numberOfDays:      number;
  totalPrice:        number;
  paymentType:       string;
  status:            string;
  createdAt:         string;
  profilePictureUrl: string;
}

interface ApiRestaurantBooking {
  bookingId:         number;
  restaurantName:    string;
  restaurantAddress: string;
  bookingDate:       string;
  guestName:         string;
  guestPhone:        string;
  tablesForTwo:      number;
  tablesForFour:     number;
  tablesForSix:      number;
  createdAt:         string;
  mainImageUrl:      string;
}

interface BookingsApiResponse {
  hotelBookings:      ApiHotelBooking[];
  tourGuideBookings:  ApiTourGuideBooking[];
  restaurantBookings: ApiRestaurantBooking[];
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookingsComponent implements OnInit {

  bookings:         MyBookingItem[] = [];
  filteredBookings: MyBookingItem[] = [];
  activeFilter:     FilterStatus    = 'all';
  isLoading                         = true;
  selectedBooking:  MyBookingItem | null = null;
  bookingToDelete:  MyBookingItem | null = null;

  filters: { label: string; value: FilterStatus }[] = [
    { label: 'All',       value: 'all'       },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Pending',   value: 'pending'   },
  ];

  private readonly apiUrl = `${environment.apiUrl}/Account/bookings`;

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  private loadBookings(): void {
    const token = localStorage.getItem('voyago_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get<BookingsApiResponse>(this.apiUrl, { headers }).subscribe({
      next: (res) => {
        this.bookings = [
          ...this.mapHotelBookings(res.hotelBookings ?? []),
          ...this.mapTourGuideBookings(res.tourGuideBookings ?? []),
          ...this.mapRestaurantBookings(res.restaurantBookings ?? []),
        ];
        this.applyFilter('all');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load bookings:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /* ── Mappers: API → internal model ─────────────────────── */

  private mapHotelBookings(list: ApiHotelBooking[]): HotelBookingItem[] {
    return list.map((b): HotelBookingItem => ({
      bookingType:    'hotel',
      bookingId:      `MH-${b.bookingId}`,
      rawBookingId:   b.bookingId,
      hotelName:      b.hotelName,
      hotelImage:     b.mainImageUrl,
      checkIn:        b.checkIn,
      checkOut:       b.checkOut,
      totalNights:    b.nights,
      rooms:          [],           // الباك إند مش بيرجع تفاصيل الأوضة — هيتعرض بدون rooms breakdown
      totalAmount:    b.totalPrice,
      serviceCharge:  0,            // مش موجود في الـ response
      discount:       0,
      discountAmount: 0,
      paymentMethod:  this.mapPaymentType(b.paymentType),
      status:         this.mapStatus(b.status),
      createdAt:      this.formatDate(b.createdAt),
    }));
  }

  private mapTourGuideBookings(list: ApiTourGuideBooking[]): TourGuideBookingItem[] {
    return list.map((b): TourGuideBookingItem => ({
      bookingType:   'tourguide',
      bookingId:     `TG-${b.bookingId}`,
      rawBookingId:  b.bookingId,
      guideName:     b.tourGuideName,
      guideImage:    b.profilePictureUrl,
      date:          b.bookingDate,
      days:          b.numberOfDays,
      pricePerDay:   b.numberOfDays > 0 ? Math.round(b.totalPrice / b.numberOfDays) : undefined,
      totalAmount:   b.totalPrice,
      paymentMethod: this.mapPaymentType(b.paymentType),
      status:        this.mapStatus(b.status),
      createdAt:     this.formatDate(b.createdAt),
    }));
  }

  private mapRestaurantBookings(list: ApiRestaurantBooking[]): RestaurantBookingItem[] {
    return list.map((b): RestaurantBookingItem => {
      const tables: BookingRoom[] = [];
      if (b.tablesForTwo  > 0) tables.push({ type: 'Table for 2', quantity: b.tablesForTwo,  price: 0 });
      if (b.tablesForFour > 0) tables.push({ type: 'Table for 4', quantity: b.tablesForFour, price: 0 });
      if (b.tablesForSix  > 0) tables.push({ type: 'Table for 6', quantity: b.tablesForSix,  price: 0 });

      return {
        bookingType:       'restaurant',
        bookingId:         `RES-${b.bookingId}`,
        rawBookingId:      b.bookingId,
        restaurantName:    b.restaurantName,
        restaurantImage:   b.mainImageUrl,
        restaurantAddress: b.restaurantAddress,
        date:              b.bookingDate,
        guestName:         b.guestName,
        phone:             b.guestPhone,
        tables,
        totalAmount:       0,
        status:            'confirmed',
        createdAt:         this.formatDate(b.createdAt),
      };
    });
  }

  /* ── Utility helpers ────────────────────────────────────── */

  /**
   * بتحول paymentType من الـ API لـ 'credit' | 'cash'
   * API بيبعت: "card" | "cash on arrival"
   */
  private mapPaymentType(paymentType: string): 'credit' | 'cash' {
    return paymentType?.toLowerCase() === 'card' ? 'credit' : 'cash';
  }

  /**
   * بتحول status من الـ API لـ 'confirmed' | 'pending'
   * API بيبعت: "Completed" | "Pending" | "Confirmed" وغيرهم
   */
  private mapStatus(status: string): 'confirmed' | 'pending' {
    const s = status?.toLowerCase();
    return s === 'completed' || s === 'confirmed' ? 'confirmed' : 'pending';
  }

  /** بتحول ISO date string لـ YYYY-MM-DD */
  private formatDate(iso: string): string {
    if (!iso) return '';
    return iso.split('T')[0];
  }

  /* ── Filter & sections ──────────────────────────────────── */

  applyFilter(status: FilterStatus): void {
    this.activeFilter = status;
    this.filteredBookings =
      status === 'all'
        ? [...this.bookings]
        : this.bookings.filter(b => this.effectiveStatus(b) === status);
  }

  get bookingSections(): BookingSection[] {
    return [
      {
        key:   'hotel',
        label: 'Hotels',
        icon:  '🏨',
        items: this.filteredBookings.filter(b => b.bookingType === 'hotel'),
      },
      {
        key:   'restaurant',
        label: 'Restaurants',
        icon:  '🍽️',
        items: this.filteredBookings.filter(b => b.bookingType === 'restaurant'),
      },
      {
        key:   'tourguide',
        label: 'Tour Guides',
        icon:  '🧭',
        items: this.filteredBookings.filter(b => b.bookingType === 'tourguide'),
      },
    ];
  }

  scrollSection(track: HTMLElement, direction: number): void {
    const amount = track.clientWidth * 0.85 * direction;
    track.scrollBy({ left: amount, behavior: 'smooth' });
  }

  openDetails(b: MyBookingItem): void  { this.selectedBooking = b; }
  closeDetails(): void                 { this.selectedBooking = null; }

  get counts(): Record<FilterStatus, number> {
    return {
      all:       this.bookings.length,
      confirmed: this.bookings.filter(b => this.effectiveStatus(b) === 'confirmed').length,
      pending:   this.bookings.filter(b => this.effectiveStatus(b) === 'pending').length,
    };
  }

  /* ── Type guards ───────────────────────────────────────── */
  isHotel(b: MyBookingItem): b is HotelBookingItem {
    return b.bookingType === 'hotel';
  }

  isTourGuide(b: MyBookingItem): b is TourGuideBookingItem {
    return b.bookingType === 'tourguide';
  }

  isRestaurant(b: MyBookingItem): b is RestaurantBookingItem {
    return b.bookingType === 'restaurant';
  }

  /* ── Helpers بتشتغل على أي نوع من غير تكرار في الـ HTML ── */
  cardImage(b: MyBookingItem): string | undefined {
    if (this.isHotel(b))     return b.hotelImage;
    if (this.isTourGuide(b)) return b.guideImage;
    return b.restaurantImage;
  }

  cardTitle(b: MyBookingItem): string {
    if (this.isHotel(b))     return b.hotelName;
    if (this.isTourGuide(b)) return b.guideName;
    return b.restaurantName;
  }

  typeBadge(b: MyBookingItem): string {
    if (this.isHotel(b))     return '🏨 Hotel';
    if (this.isTourGuide(b)) return '🧭 Tour Guide';
    return '🍽️ Restaurant';
  }

  itemSummary(items: BookingRoom[]): string {
    return items.map(i => `${i.quantity}× ${i.type}`).join(', ');
  }

  effectiveStatus(b: MyBookingItem): 'confirmed' | 'pending' {
    return b.status;
  }

  depositAmount(b: HotelBookingItem | TourGuideBookingItem): number {
    return Math.round(b.totalAmount * 0.3);
  }

  remainingAmount(b: HotelBookingItem | TourGuideBookingItem): number {
    return b.totalAmount - this.depositAmount(b);
  }

  /* ── Delete flow ───────────────────────────────────────── */
  requestDelete(b: MyBookingItem, event: MouseEvent): void {
    event.stopPropagation();
    this.bookingToDelete = b;
  }

  cancelDelete(): void {
    this.bookingToDelete = null;
  }

  confirmDelete(): void {
    if (!this.bookingToDelete) return;

    const b         = this.bookingToDelete;
    const token     = localStorage.getItem('voyago_token');
    const headers   = new HttpHeaders({ Authorization: `Bearer ${token}` });
   const url = `${environment.apiUrl}/Account/bookings/${b.rawBookingId}?bookingType=${b.bookingType}`;

    this.http.delete(url, { headers }).subscribe({
      next: () => {
        this.bookings = this.bookings.filter(item => item.bookingId !== b.bookingId);
        this.applyFilter(this.activeFilter);

        if (this.selectedBooking?.bookingId === b.bookingId) {
          this.selectedBooking = null;
        }

        this.bookingToDelete = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete booking:', err);
        this.bookingToDelete = null;
        this.cdr.detectChanges();
      },
    });
  }
}