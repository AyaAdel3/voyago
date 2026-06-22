import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  RoomType, HotelFeature, BookingData, BOARD_FEATURE_NAMES,
  HotelApiDetail, HotelApiComment, HotelApiBookingFeature,
  CreateBookingRequest, CreateBookingResponse,
  BookingRoomRequest, ROOM_TYPE_MAP,
} from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export interface PriceLine {
  label:  string;
  amount: number;
}

// ── Custom calendar day cell ───────────────────────────────
interface CalendarDay {
  date: Date | null;
  dateStr: string;
  day: number;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  inCurrentMonth: boolean;
}

// أي حقل من الاتنين (check-in / check-out) بيستخدم نفس الشكل، فبنفرقهم بـ field
type DateField = 'checkIn' | 'checkOut';

@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {
  hotel!: HotelApiDetail;
  reviews: HotelApiComment[] = [];

  // ── Loading split into two independent stages ─────────────
  // `loading`        → gates the core page (hero, images, rooms, pricing)
  // `reviewsLoading`  → gates only the reviews section, so the rest of the
  //                      page never waits on comments to render
  loading        = true;
  reviewsLoading = true;
  error          = false;

  checkIn  = '';
  checkOut = '';
  nights   = 0;
  selectedRooms: RoomType[]        = [];
  selectedFeatures: HotelFeature[] = [];

  // ══════════════════════════════════════════════════════
  // الحد الأقصى لعدد الغرف المتاحة من كل نوع جوه الفندق
  // (singleRooms / doubleRooms / tripleRooms / suiteRooms)
  // مفتاحها بنفس "type" بتاع selectedRooms (Single/Double/Triple/Suite)
  // ══════════════════════════════════════════════════════
  roomMaxCounts: Record<string, number> = {};

  priceLines:    PriceLine[] = [];
  serviceCharge  = 0;
  discountAmount = 0;
  totalAmount    = 0;
  bookingError   = '';

  showLoginPrompt = false;
  reviewToDelete: HotelApiComment | null = null;

  newComment  = '';
  newRating   = 0;
  submitting  = false;
  reviewError = '';

  activeImage  = 0;
  lightboxOpen = false;
  lbIndex      = 0;

  bookingSubmitting = false;

  // ══════════════════════════════════════════════════════
  // Custom calendar / fully-booked-dates state
  // كل حقل (check-in / check-out) له كاليندر مستقل تماماً
  // ══════════════════════════════════════════════════════
  showCalendarCheckIn  = false;
  showCalendarCheckOut = false;

  loadingBookedDatesCheckIn  = false;
  loadingBookedDatesCheckOut = false;

  // الأيام المحجوزة بالكامل، مفتاحها "YYYY-M" (سنة-شهر) عشان نكاش كل شهر اتجاب قبل كده
  private bookedDatesCacheCheckIn  = new Map<string, Set<string>>();
  private bookedDatesCacheCheckOut = new Map<string, Set<string>>();

  bookedDatesCheckIn:  Set<string> = new Set();
  bookedDatesCheckOut: Set<string> = new Set();

  calendarMonthCheckIn:  Date = new Date();
  calendarMonthCheckOut: Date = new Date();

  calendarWeeksCheckIn:  CalendarDay[][] = [];
  calendarWeeksCheckOut: CalendarDay[][] = [];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private route:        ActivatedRoute,
    public  router:       Router,
    private hotelService: HotelService,
    private authService:  AuthService,
    private authModal:    AuthModalService,
    private cdr:          ChangeDetectorRef,
  ) {}

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (event.key === 'ArrowRight') this.lbNext();
    else if (event.key === 'ArrowLeft') this.lbPrev();
    else if (event.key === 'Escape') this.closeLightbox();
  }

  // بيقفل أي كاليندر مفتوح لو ضغطنا برة الـ wrapper بتاعه
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.showCalendarCheckIn) {
      if (!target.closest('.calendar-popup-checkIn') && !target.closest('.date-display-btn-checkIn')) {
        this.showCalendarCheckIn = false;
        this.cdr.detectChanges();
      }
    }

    if (this.showCalendarCheckOut) {
      if (!target.closest('.calendar-popup-checkOut') && !target.closest('.date-display-btn-checkOut')) {
        this.showCalendarCheckOut = false;
        this.cdr.detectChanges();
      }
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!id || isNaN(id)) { this.router.navigate(['/hotels']); return; }
      this.loading        = true;
      this.reviewsLoading = true;
      this.error          = false;
      this.hotel          = null!;
      this.reviews         = [];

      // ريسيت حالة الكاليندرات لما نغير الأوتيل
      this.checkIn  = '';
      this.checkOut = '';
      this.bookedDatesCacheCheckIn.clear();
      this.bookedDatesCacheCheckOut.clear();
      this.bookedDatesCheckIn  = new Set();
      this.bookedDatesCheckOut = new Set();
      this.calendarMonthCheckIn  = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      this.calendarMonthCheckOut = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      this.cdr.detectChanges();
      this.loadHotel(id);
    });
  }

  private loadHotel(id: number): void {
    this.hotelService.getHotelApiById(id).subscribe({
      next: (hotel) => {
        this.hotel = hotel;

        this.selectedRooms = [
          { type: 'Single', price: hotel.singlePrice, quantity: 0 },
          { type: 'Double', price: hotel.doublePrice, quantity: 0 },
          { type: 'Triple', price: hotel.triplePrice, quantity: 0 },
          { type: 'Suite',  price: hotel.suitePrice,  quantity: 0 },
        ];

        // ── الحد الأقصى المتاح من كل نوع روم جوه الفندق ──
        this.roomMaxCounts = {
          Single: hotel.singleRooms ?? 0,
          Double: hotel.doubleRooms ?? 0,
          Triple: hotel.tripleRooms ?? 0,
          Suite:  hotel.suiteRooms  ?? 0,
        };

        this.selectedFeatures = (hotel.bookingFeatures ?? []).map((f: HotelApiBookingFeature) => ({
          id:       f.id,
          name:     f.name,
          icon:     f.icon,
          price:    f.price,
          selected: false,
          quantity: 0,
        }));

        // Core page is ready now — release the main loading gate
        // immediately, without waiting on reviews to be processed.
        this.loading = false;
        this.error   = false;
        this.recalc();
        this.cdr.detectChanges();

        // Reviews already arrived inside the same payload — assign them
        // on a separate tick/state so the reviews section can show its
        // own (smaller) skeleton independently of the rest of the page.
        this.reviews        = hotel.comments ?? [];
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading        = false;
        this.reviewsLoading = false;
        this.error           = true;
        this.cdr.detectChanges();
      },
    });
  }

  private loadReviews(id: number): void {
    this.reviewsLoading = true;
    this.cdr.detectChanges();
    this.hotelService.getComments(id).subscribe({
      next: (reviews: HotelApiComment[]) => {
        this.reviews        = reviews;
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get hotelImages(): string[] {
    return this.hotel?.images?.map(img => img.imageUrl) ?? [];
  }

  get currentUserName(): string {
    return this.authService.getFullName() || 'Guest';
  }

  get currentUserAvatar(): string {
    return this.authService.currentUser()?.profileImage || '';
  }

  goToLogin(): void {
    this.showLoginPrompt = false;
    this.authModal.openLogin();
  }

  checkAuthBeforeInteract(): boolean {
    if (this.authService.isAdmin()) {
      this.authService.forceLogout();
      this.router.navigate(['/home']);
      return false;
    }
    if (!this.authService.isLoggedIn()) {
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return false;
    }
    return true;
  }

  get totalRoomsSelected(): number {
    return this.selectedRooms.reduce((s, r) => s + r.quantity, 0);
  }

  get totalBoardSelected(): number {
    return this.selectedFeatures
      .filter(f => BOARD_FEATURE_NAMES.includes(f.name))
      .reduce((s, f) => s + f.quantity, 0);
  }

  get hotelDiscount(): number {
    return this.hotel?.discount ?? 0;
  }

  get hotelServiceChargePct(): number {
    return this.hotel?.serviceCharge ?? 0;
  }

  setActiveImage(i: number): void { this.activeImage = i; }

  openLightbox(i: number): void {
    this.lbIndex = i;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.lbIndex < this.hotelImages.length - 1) this.lbIndex++; }

  recalc(): void {
    this.nights = calcNights(this.checkIn, this.checkOut);
    const hasDate = !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn);

    this.priceLines    = [];
    this.serviceCharge  = 0;
    this.discountAmount = 0;
    this.totalAmount    = 0;

    if (!hasDate) return;

    const roomsCostPerNight = this.selectedRooms.reduce((s, r) => s + r.price * r.quantity, 0);
    const roomsTotal        = roomsCostPerNight * this.nights;

    if (roomsTotal > 0) {
      this.priceLines.push({
        label:  `${this.nights} Night${this.nights !== 1 ? 's' : ''}`,
        amount: roomsTotal,
      });
    }

    let featuresTotal = 0;
    for (const f of this.selectedFeatures) {
      if (f.quantity > 0 && f.price > 0) {
        const lineAmount = f.price * f.quantity * this.nights;
        featuresTotal   += lineAmount;
        this.priceLines.push({
          label:  `${f.name} × ${f.quantity}`,
          amount: lineAmount,
        });
      }
    }

    const subtotal = roomsTotal + featuresTotal;

    this.discountAmount = this.hotelDiscount > 0
      ? Math.round(subtotal * this.hotelDiscount / 100)
      : 0;

    const afterDiscount = subtotal - this.discountAmount;

    this.serviceCharge = this.hotelServiceChargePct > 0
      ? Math.round(afterDiscount * this.hotelServiceChargePct / 100)
      : 0;

    this.totalAmount = afterDiscount + this.serviceCharge;
  }

  // ══════════════════════════════════════════════════════
  // Room max-count helpers
  // ══════════════════════════════════════════════════════

  /** الحد الأقصى المتاح لنوع روم معين (حسب اسمه: Single/Double/Triple/Suite) */
  getRoomMax(room: RoomType): number {
    return this.roomMaxCounts[room.type] ?? 0;
  }

  /** هل الروم ده وصل لأقصى عدد متاح منه؟ (بنستخدمها في التمبليت لقفل زرار +) */
  isRoomMaxed(room: RoomType): boolean {
    return room.quantity >= this.getRoomMax(room);
  }

  /** هل النوع ده مخلّص بالكامل (مفيش غرف منه أصلاً)؟ */
  isRoomSoldOut(room: RoomType): boolean {
    return this.getRoomMax(room) === 0;
  }

  changeRoom(i: number, delta: number): void {
    if (!this.checkAuthBeforeInteract()) return;

    const room = this.selectedRooms[i];
    const max  = this.getRoomMax(room);

    let newQty = room.quantity + delta;
    newQty = Math.max(0, newQty);
    // ممنوع نتعدى العدد الكلي المتاح من النوع ده جوه الفندق
    newQty = Math.min(newQty, max);

    room.quantity = newQty;

    this.clampFeaturesToRooms();
    if (this.canClearError()) this.bookingError = '';
    this.recalc();
  }

  canIncrement(f: HotelFeature): boolean {
    if (this.totalRoomsSelected === 0) return false;
    return BOARD_FEATURE_NAMES.includes(f.name)
      ? this.totalBoardSelected < this.totalRoomsSelected
      : f.quantity < this.totalRoomsSelected;
  }

  changeFeature(i: number, delta: number): void {
    if (!this.checkAuthBeforeInteract()) return;
    const f      = this.selectedFeatures[i];
    const newVal = f.quantity + delta;
    if (newVal < 0) return;
    if (delta > 0 && !this.canIncrement(f)) return;
    f.quantity = newVal;
    this.recalc();
  }

  private clampFeaturesToRooms(): void {
    const total = this.totalRoomsSelected;
    this.selectedFeatures.forEach(f => {
      if (f.quantity > total) f.quantity = total;
    });
    const boardTotal = this.totalBoardSelected;
    if (boardTotal > total) {
      for (let i = this.selectedFeatures.length - 1; i >= 0; i--) {
        const f = this.selectedFeatures[i];
        if (BOARD_FEATURE_NAMES.includes(f.name) && f.quantity > 0) {
          f.quantity = Math.max(0, f.quantity - (boardTotal - total));
          break;
        }
      }
    }
  }

  private canClearError(): boolean {
    return (
      this.selectedRooms.some(r => r.quantity > 0) &&
      !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn)
    );
  }

  // ══════════════════════════════════════════════════════
  // Date helpers
  // ══════════════════════════════════════════════════════
  private toDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  private monthCacheKey(monthDate: Date): string {
    return `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
  }

  // ══════════════════════════════════════════════════════
  // Fully-booked-dates fetching (per field, per month, cached)
  // ══════════════════════════════════════════════════════
  private fetchBookedDates(field: DateField, monthDate: Date): void {
    if (!this.hotel) return;

    const cache   = field === 'checkIn' ? this.bookedDatesCacheCheckIn : this.bookedDatesCacheCheckOut;
    const cacheKey = this.monthCacheKey(monthDate);

    if (cache.has(cacheKey)) {
      this.applyBookedDates(field, cache.get(cacheKey)!);
      return;
    }

    if (field === 'checkIn')  this.loadingBookedDatesCheckIn  = true;
    if (field === 'checkOut') this.loadingBookedDatesCheckOut = true;
    this.cdr.detectChanges();

    const year  = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;

    this.hotelService.getFullyBookedDates(this.hotel.id, year, month).subscribe({
      next: (res) => {
        const set = new Set(res.fullyBookedDates ?? []);
        cache.set(cacheKey, set);
        this.applyBookedDates(field, set);
        if (field === 'checkIn')  this.loadingBookedDatesCheckIn  = false;
        if (field === 'checkOut') this.loadingBookedDatesCheckOut = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // لو الـ API فشل، منمنعش الحجز بالكامل، بس مايبقاش في تواريخ معطلة بسبب فشل الجلب
        const empty = new Set<string>();
        cache.set(cacheKey, empty);
        this.applyBookedDates(field, empty);
        if (field === 'checkIn')  this.loadingBookedDatesCheckIn  = false;
        if (field === 'checkOut') this.loadingBookedDatesCheckOut = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applyBookedDates(field: DateField, set: Set<string>): void {
    if (field === 'checkIn') {
      this.bookedDatesCheckIn = set;
      this.buildCalendar('checkIn');
    } else {
      this.bookedDatesCheckOut = set;
      this.buildCalendar('checkOut');
    }
  }

  // ══════════════════════════════════════════════════════
  // Calendar rendering (shared logic, parametrized by field)
  // ══════════════════════════════════════════════════════
  buildCalendar(field: DateField): void {
    const monthDate  = field === 'checkIn' ? this.calendarMonthCheckIn : this.calendarMonthCheckOut;
    const bookedSet  = field === 'checkIn' ? this.bookedDatesCheckIn   : this.bookedDatesCheckOut;
    const selectedStr = field === 'checkIn' ? this.checkIn             : this.checkOut;

    const year  = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday    = firstDayOfMonth.getDay();
    const daysInMonth     = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // لو بنبني كاليندر check-out، الحد الأدنى للتاريخ المسموح هو اليوم اللي بعد check-in
    let minAllowed = today;
    if (field === 'checkOut' && this.checkIn) {
      const checkInDate = new Date(this.checkIn + 'T00:00:00');
      const dayAfterCheckIn = new Date(checkInDate);
      dayAfterCheckIn.setDate(dayAfterCheckIn.getDate() + 1);
      minAllowed = dayAfterCheckIn > today ? dayAfterCheckIn : today;
    }

    const cells: CalendarDay[] = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr  = this.toDateStr(date);
      const isPast   = date.getTime() < minAllowed.getTime();
      const isBooked = bookedSet.has(dateStr);
      cells.push({
        date,
        dateStr,
        day,
        disabled: isPast || isBooked,
        isToday: date.getTime() === today.getTime(),
        isSelected: dateStr === selectedStr,
        inCurrentMonth: true
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    if (field === 'checkIn') this.calendarWeeksCheckIn  = weeks;
    else                     this.calendarWeeksCheckOut = weeks;
  }

  monthLabel(field: DateField): string {
    const monthDate = field === 'checkIn' ? this.calendarMonthCheckIn : this.calendarMonthCheckOut;
    return monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  canGoPrevMonth(field: DateField): boolean {
    const monthDate = field === 'checkIn' ? this.calendarMonthCheckIn : this.calendarMonthCheckOut;
    const today = new Date();
    return !(monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth());
  }

  displaySelectedDate(field: DateField): string {
    const value = field === 'checkIn' ? this.checkIn : this.checkOut;
    if (!value) return field === 'checkIn' ? 'Check in' : 'Check out';
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  prevMonth(field: DateField): void {
    if (!this.canGoPrevMonth(field)) return;
    if (field === 'checkIn') {
      this.calendarMonthCheckIn = new Date(this.calendarMonthCheckIn.getFullYear(), this.calendarMonthCheckIn.getMonth() - 1, 1);
    } else {
      this.calendarMonthCheckOut = new Date(this.calendarMonthCheckOut.getFullYear(), this.calendarMonthCheckOut.getMonth() - 1, 1);
    }
    this.fetchBookedDates(field, field === 'checkIn' ? this.calendarMonthCheckIn : this.calendarMonthCheckOut);
  }

  nextMonth(field: DateField): void {
    const monthDate = field === 'checkIn'
      ? new Date(this.calendarMonthCheckIn.getFullYear(), this.calendarMonthCheckIn.getMonth() + 1, 1)
      : new Date(this.calendarMonthCheckOut.getFullYear(), this.calendarMonthCheckOut.getMonth() + 1, 1);

    if (field === 'checkIn') this.calendarMonthCheckIn = monthDate;
    else                     this.calendarMonthCheckOut = monthDate;

    this.fetchBookedDates(field, monthDate);
  }

  toggleCalendar(field: DateField): void {
    if (!this.checkAuthBeforeInteract()) return;

    if (field === 'checkIn') {
      if (this.loadingBookedDatesCheckIn) return;
      this.showCalendarCheckIn = !this.showCalendarCheckIn;
      if (this.showCalendarCheckIn) {
        this.showCalendarCheckOut = false;
        this.fetchBookedDates('checkIn', this.calendarMonthCheckIn);
      }
    } else {
      if (this.loadingBookedDatesCheckOut) return;
      this.showCalendarCheckOut = !this.showCalendarCheckOut;
      if (this.showCalendarCheckOut) {
        this.showCalendarCheckIn = false;
        this.fetchBookedDates('checkOut', this.calendarMonthCheckOut);
      }
    }
  }

  selectDay(field: DateField, cell: CalendarDay): void {
    if (cell.disabled || !cell.inCurrentMonth) return;

    if (field === 'checkIn') {
      this.checkIn = cell.dateStr;
      this.showCalendarCheckIn = false;

      // لو الـ check-out بقى قبل أو يساوي check-in الجديد، فضّيه
      if (this.checkOut && new Date(this.checkOut) <= new Date(this.checkIn)) {
        this.checkOut = '';
      }
      this.buildCalendar('checkIn');
      // كاليندر check-out لازم يتبني تاني عشان الحد الأدنى بيعتمد على check-in
      this.buildCalendar('checkOut');
    } else {
      this.checkOut = cell.dateStr;
      this.showCalendarCheckOut = false;
      this.buildCalendar('checkOut');
    }

    if (this.canClearError()) this.bookingError = '';
    this.recalc();
    this.cdr.detectChanges();
  }

  onClose(): void {} // no-op placeholder kept for template parity if needed

  // ══════════════════════════════════════════════════════
  // Booking
  // ══════════════════════════════════════════════════════
  bookNow(): void {
    if (!this.checkAuthBeforeInteract()) return;
    if (this.bookingSubmitting) return;

    const selectedRooms = this.selectedRooms.filter(r => r.quantity > 0);
    if (selectedRooms.length === 0)                        { this.bookingError = 'Please select at least one room to continue.'; return; }
    if (!this.checkIn || !this.checkOut)                   { this.bookingError = 'Please select check-in and check-out dates.'; return; }
    if (new Date(this.checkOut) <= new Date(this.checkIn)) { this.bookingError = 'Check-out date must be after check-in date.'; return; }

    this.bookingError = '';

    const roomsPayload: BookingRoomRequest[] = selectedRooms.map(r => ({
      roomType: ROOM_TYPE_MAP[r.type],
      quantity: r.quantity,
    }));

    const fullBoardRooms = this.selectedFeatures
      .filter(f => f.name === 'Full Board')
      .reduce((s, f) => s + f.quantity, 0);

    const halfBoardRooms = this.selectedFeatures
      .filter(f => f.name === 'Half Board')
      .reduce((s, f) => s + f.quantity, 0);

    const extraFeatures = this.selectedFeatures
      .filter(f => !BOARD_FEATURE_NAMES.includes(f.name) && f.quantity > 0)
      .map(f => ({
        bookingFeatureId: f.id ?? 0,
        roomsCount:       f.quantity,
      }));

    const payload: CreateBookingRequest = {
      checkIn:        this.checkIn,
      checkOut:       this.checkOut,
      rooms:          roomsPayload,
      fullBoardRooms,
      halfBoardRooms,
      extraFeatures,
    };

    const token = localStorage.getItem('voyago_token') ?? '';

    this.bookingSubmitting = true;
    this.hotelService.createBooking(this.hotel.id, payload, token).subscribe({
      next: (res) => {
        // ✅ حفظ الـ bookingId عشان confirmBooking يقدر يبني الـ URL صح
        this.hotelService.saveBookingId(res.bookingId);
        this.bookingSubmitting = false;

        const bookingData: BookingData = {
          hotelId:        this.hotel.id,
          hotelName:      res.hotelName,
          checkIn:        res.checkIn,
          checkOut:       res.checkOut,
          rooms:          this.selectedRooms.filter(r => r.quantity > 0),
          features:       this.selectedFeatures.filter(f => f.quantity > 0),
          totalNights:    res.nights,
          discount:       res.discountPercentage,
          discountAmount: res.discountAmount,
          serviceCharge:  res.serviceChargeAmount,
          subtotal:       res.subtotal,
          totalAmount:    res.totalPrice,
        };

        this.hotelService.setBooking(bookingData);
        this.router.navigate(['/hotels/booking']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Booking failed:', err);
        this.bookingSubmitting = false;
        this.bookingError = err?.error?.message || 'Failed to create booking. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  isMyReview(review: HotelApiComment): boolean {
    const fullName = this.authService.getFullName()?.trim();
    return !!fullName && review.userName?.trim() === fullName;
  }

  submitReview(): void {
    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }
    if (!this.newComment.trim() || this.newRating === 0 || this.submitting) return;

    this.submitting  = true;
    this.reviewError = '';

    this.hotelService.addComment(this.hotel.id, this.newComment.trim(), this.newRating)
      .subscribe({
        next: () => {
          this.newComment = '';
          this.newRating  = 0;
          this.loadReviews(this.hotel.id);
          this.submitting = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.submitting  = false;
          this.reviewError = 'Failed to submit review. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  requestDeleteReview(review: HotelApiComment): void { this.reviewToDelete = review; }
  cancelDelete(): void { this.reviewToDelete = null; }

  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;
    const commentId = this.reviewToDelete.id;
    this.hotelService.deleteComment(this.hotel.id, commentId).subscribe({
      next: () => {
        this.reviews        = this.reviews.filter(r => r.id !== commentId);
        this.reviewToDelete = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete review:', err);
        this.reviewToDelete = null;
      },
    });
  }

  starsArray(n: number): number[] { return Array(n).fill(0); }

  formatReviewDate(dateStr: string): string {
    if (!dateStr) return '';
    const d      = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}