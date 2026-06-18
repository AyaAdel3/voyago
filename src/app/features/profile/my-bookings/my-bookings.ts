// my-bookings.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/* ── Shared shape: hotel rooms & restaurant tables ─────────── */
export interface BookingRoom {
  type:     string;
  quantity: number;
  price:    number;
}

/* ── Fields shared by every booking type ──────────────────── */
interface BaseBookingItem {
  bookingId:   string;
  totalAmount: number;
  /**
   * status الخام جاي من الباك إند — مش بيتستخدم في العرض أو الفلترة دلوقتي.
   * المصدر الفعلي للحالة هو effectiveStatus() (مبني على paymentMethod).
   * سايبينها هنا احتياطي لو الباك إند احتاجها بعدين.
   */
  status:      'confirmed' | 'pending';
  createdAt?:  string;
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // ── Dummy data – استبدليها بـ API calls (hotel + tour guide + restaurant) بعدين ──
    setTimeout(() => {
      this.bookings = MOCK_BOOKINGS;
      this.applyFilter('all');
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 600);
  }

  applyFilter(status: FilterStatus): void {
    this.activeFilter = status;
    this.filteredBookings =
      status === 'all'
        ? [...this.bookings]
        : this.bookings.filter(b => this.effectiveStatus(b) === status);
  }

  /**
   * بتقسم filteredBookings (اللي بالفعل متفلترة حسب All/Confirmed/Pending)
   * لـ 3 سكاشن حسب النوع. السكشن اللي مفيهوش عناصر هيتشال من العرض في الـ HTML
   * (مش بيتعرض فاضي).
   */
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

  /**
   * بتحرك شريط السكشن (slider) لشمال أو يمين.
   * track: العنصر اللي عليه overflow-x (مأخوذ من template reference variable).
   * direction: -1 لليسار، 1 لليمين.
   */
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

  /**
   * الحالة الفعلية اللي بتتعرض وبتتفلتر عليها الواجهة.
   * - مطعم → confirmed دايمًا
   * - كاش (فندق/تور جايد) → pending
   * - كريدت (فندق/تور جايد) → confirmed
   */
  effectiveStatus(b: MyBookingItem): 'confirmed' | 'pending' {
    if (this.isRestaurant(b)) return 'confirmed';
    return b.paymentMethod === 'cash' ? 'pending' : 'confirmed';
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

    // TODO: استبدليها بـ API call لمسح الحجز من السيرفر، وبعد الـ success امسحيها محليًا
    this.bookings = this.bookings.filter(b => b.bookingId !== this.bookingToDelete!.bookingId);
    this.applyFilter(this.activeFilter);

    if (this.selectedBooking?.bookingId === this.bookingToDelete.bookingId) {
      this.selectedBooking = null;
    }

    this.bookingToDelete = null;
    this.cdr.detectChanges();
  }
}

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_BOOKINGS: MyBookingItem[] = [
  {
    bookingType:    'hotel',
    bookingId:      'MH-2024-0001',
    hotelName:      'Grand Nile Tower',
    hotelImage:     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
    checkIn:        '2025-07-10',
    checkOut:       '2025-07-14',
    totalNights:    4,
    rooms:          [{ type: 'Deluxe Double', quantity: 1, price: 850 }],
    totalAmount:    3740,
    serviceCharge:  340,
    discount:       5,
    discountAmount: 187,
    paymentMethod:  'credit',
    status:         'confirmed',
    createdAt:      '2025-06-01',
  },
  {
    bookingType:    'hotel',
    bookingId:      'MH-2024-0002',
    hotelName:      'Marriott Mena House',
    hotelImage:     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
    checkIn:        '2025-08-01',
    checkOut:       '2025-08-05',
    totalNights:    4,
    rooms:          [{ type: 'Suite', quantity: 1, price: 1200 }],
    totalAmount:    5100,
    serviceCharge:  300,
    discount:       0,
    discountAmount: 0,
    paymentMethod:  'cash',
    status:         'pending',
    createdAt:      '2025-06-10',
  },
  {
    bookingType:   'tourguide',
    bookingId:     'TG-9F3K-22LP',
    guideName:     'Ahmed Hassan',
    guideImage:    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    date:          '2025-07-20',
    days:          2,
    pricePerDay:   600,
    totalAmount:   1200,
    paymentMethod: 'credit',
    status:        'confirmed',
    createdAt:     '2025-06-15',
  },
  {
    bookingType:       'restaurant',
    bookingId:         'RES-7QX4KD2A',
    restaurantName:    'Nile Breeze Restaurant',
    restaurantImage:   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    restaurantAddress: 'Corniche El Nil, Fayoum',
    date:              '2025-07-05',
    guestName:         'Mona Saeed',
    phone:             '01012345678',
    tables:            [{ type: 'Table For 4', quantity: 1, price: 0 }],
    totalAmount:       0,
    status:            'confirmed',
    createdAt:         '2025-06-12',
  },
];