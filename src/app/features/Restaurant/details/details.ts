import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Restaurant,
  RestaurantReview,
  TableType,
  ReservationData,
  AVAILABLE_TIMES,
  Feature,
} from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

interface CalendarDay {
  date: Date | null;
  dateStr: string;
  day: number;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  inCurrentMonth: boolean;
}

@Component({
  selector: 'app-restaurant-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details implements OnInit {

  restaurant!: Restaurant;
  reviews: RestaurantReview[] = [];

  loading = true;
  error = false;

  selectedDate = '';
  selectedTables: TableType[] = [];
  guestName = '';
  phone = '';
  resError = '';

  showLoginPrompt = false;
  reviewToDelete: RestaurantReview | null = null;

  todayStr = new Date().toISOString().split('T')[0];
  availableTimes = AVAILABLE_TIMES;

  newComment = '';
  newRating = 0;

  isSubmittingReview = false;

  activeImage = 0;
  lightboxOpen = false;
  lbIndex = 0;

  // ── Custom calendar / booked-dates state ────────────────
  showCalendar = false;
  loadingBookedDates = true;
  bookedDates: Set<string> = new Set();
  calendarMonth: Date = new Date();
  calendarWeeks: CalendarDay[][] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private restaurantService: RestaurantService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (event.key === 'ArrowRight') this.lbNext();
    else if (event.key === 'ArrowLeft') this.lbPrev();
    else if (event.key === 'Escape') this.closeLightbox();
  }

  ngOnInit(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), 1);

    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!id || isNaN(id)) {
        this.router.navigate(['/Restaurants']);
        return;
      }
      this.loading = true;
      this.error = false;
      this.loadRestaurant(id);
      this.loadBookedDates(id);
    });
  }

  private loadRestaurant(id: number): void {
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (r: Restaurant | undefined) => {
        if (!r) {
          this.router.navigate(['/Restaurants']);
          return;
        }
        this.restaurant = r;
        this.selectedTables = this.restaurantService.getDefaultTables();
        this.loadReviews(id);
        this.loading = false;
        this.error = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadReviews(id: number): void {
  this.restaurantService.getReviews(id).subscribe({
    next: (reviews: RestaurantReview[]) => {

      console.log('LOADED REVIEWS:', reviews);

      this.reviews = reviews;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
    }
  });
}

  get currentUserName(): string {
    return this.authService.getFullName() || 'Guest';
  }

  goToLogin(): void {
    this.showLoginPrompt = false;
    this.authModal.openLogin();
  }

  // ✅ الأدمن → forceLogout + روح للهوم
  private checkAuthBeforeInteract(): boolean {
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

  getFeatureLabel(id: number): Feature | null {
    return this.restaurant?.features?.find(f => f.id === id) ?? null;
  }

  getPriceRange(): string {
    return `${this.restaurant.minPrice}-${this.restaurant.maxPrice} LE`;
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

  lbNext(): void {
    if (this.lbIndex < this.restaurant.images.length - 1) this.lbIndex++;
  }

  // ══════════════════════════════════════════════════════
  // Booked-dates helpers
  // ══════════════════════════════════════════════════════
  private toDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /**
   * TODO: لما الـ Backend يجهز endpoint بتاع تواريخ الريستورنت المحجوزة،
   * نستبدل الجزء ده باستدعاء حقيقي لـ RestaurantService، بنفس فكرة
   * tourGuideService.getBookedDates() الموجودة في تور جيد.
   *
   * مثال متوقع:
   * this.restaurantService.getBookedDates(id).subscribe({
   *   next: (bookings) => {
   *     this.bookedDates = this.buildBookedDatesSet(bookings || []);
   *     this.loadingBookedDates = false;
   *     this.buildCalendar();
   *     this.cdr.detectChanges();
   *   },
   *   error: () => {
   *     this.bookedDates = new Set();
   *     this.loadingBookedDates = false;
   *     this.buildCalendar();
   *     this.cdr.detectChanges();
   *   }
   * });
   */
  private loadBookedDates(id: number): void {
    // مفيش endpoint جاهز دلوقتي → بنمنع بس الأيام اللي فاتت (زي ما هو في buildCalendar).
    this.bookedDates = new Set();
    this.loadingBookedDates = false;
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  // ══════════════════════════════════════════════════════
  // Calendar rendering
  // ══════════════════════════════════════════════════════
  buildCalendar(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: CalendarDay[] = [];

    // خلايا فاضية لحد أول يوم في الشهر
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.toDateStr(date);
      const isPast = date.getTime() < today.getTime();
      const isBooked = this.bookedDates.has(dateStr);
      cells.push({
        date,
        dateStr,
        day,
        disabled: isPast || isBooked,
        isToday: date.getTime() === today.getTime(),
        isSelected: dateStr === this.selectedDate,
        inCurrentMonth: true
      });
    }

    // كمّل الأسبوع الأخير بخلايا فاضية
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    this.calendarWeeks = weeks;
  }

  get monthLabel(): string {
    return this.calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get canGoPrevMonth(): boolean {
    const today = new Date();
    return !(this.calendarMonth.getFullYear() === today.getFullYear() && this.calendarMonth.getMonth() === today.getMonth());
  }

  get displaySelectedDate(): string {
    if (!this.selectedDate) return 'Select date';
    const d = new Date(this.selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  prevMonth(): void {
    if (!this.canGoPrevMonth) return;
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  toggleCalendar(): void {
    if (this.loadingBookedDates) return;
    if (!this.checkAuthBeforeInteract()) return;
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.buildCalendar();
    }
  }

  selectDay(cell: CalendarDay): void {
    if (cell.disabled || !cell.inCurrentMonth) return;
    this.selectedDate = cell.dateStr;
    this.showCalendar = false;
    this.resError = '';
    this.tryCleanError();
    this.buildCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showCalendar) return;
    const target = event.target as HTMLElement;
    // لو الضغطة جوه الـ calendar-popup نفسه → ماتقفلوش
    // لو برا الـ date-picker-wrapper كلها → قفّله
    if (!target.closest('.calendar-popup') && !target.closest('.date-display-btn')) {
      this.showCalendar = false;
      this.cdr.detectChanges();
    }
  }

  onDateChange(): void {
    if (!this.checkAuthBeforeInteract()) {
      this.selectedDate = '';
      return;
    }
    this.resError = '';
  }

  onGuestNameChange(): void {
    if (!this.checkAuthBeforeInteract()) {
      this.guestName = '';
      return;
    }
    this.resError = '';
  }

  onPhoneChange(): void {
    if (!this.checkAuthBeforeInteract()) {
      this.phone = '';
      return;
    }
    this.resError = '';
  }

  changeTable(i: number, delta: number): void {
    if (!this.checkAuthBeforeInteract()) return;
    this.selectedTables[i].quantity = Math.max(0, this.selectedTables[i].quantity + delta);
    if (this.resError) this.tryCleanError();
  }

  private tryCleanError(): void {
    if (this.selectedDate && this.guestName.trim() && this.phone.trim()) {
      this.resError = '';
    }
  }

  formatPhone(): void {
    this.phone = this.phone.replace(/\D/g, '').substring(0, 11);
    if (this.resError) this.tryCleanError();
  }

  makeReservation(): void {
    if (!this.checkAuthBeforeInteract()) return;

    if ((this.restaurant as any).status === 'Inactive') {
      this.resError = 'This restaurant is currently not available for reservations.';
      return;
    }
    if (!this.selectedDate) { this.resError = 'Please select a date.'; return; }
    if (!this.guestName.trim()) { this.resError = 'Please enter your name.'; return; }
    if (!this.phone.trim()) { this.resError = 'Please enter your phone number.'; return; }

    const validPrefixes = ['010', '011', '012', '015'];
    const cleanPhone = this.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !validPrefixes.some(p => cleanPhone.startsWith(p))) {
      this.resError = 'Please enter a valid Egyptian number (010, 011, 012, 015).';
      return;
    }

    this.resError = '';

    const data: ReservationData = {
      restaurantId:      this.restaurant.id,
      restaurantName:    this.restaurant.name,
      restaurantAddress: this.restaurant.location,
      date:              this.selectedDate,
      time:              '',
      guestCount:        0,
      tables:            this.selectedTables.filter(t => t.quantity > 0),
      guestName:         this.guestName,
      phone:             cleanPhone,
      totalAmount:       0,
    };

    this.restaurantService.setReservation(data);
    this.router.navigate(['/restaurant/reservation', this.restaurant.id]);
  }

  isMyReview(review: RestaurantReview): boolean {
    const fullName = this.authService.getFullName()?.trim();
    return !!fullName && review.userName?.trim() === fullName;
  }

  submitReview(): void {
  if (!this.authService.isLoggedIn()) {
    this.authModal.openLogin();
    return;
  }

  if (!this.newComment.trim() || this.newRating === 0) {
    return;
  }

  if (this.isSubmittingReview) {
    return;
  }

  this.isSubmittingReview = true;

  this.restaurantService
    .submitReview(
      this.restaurant.id,
      this.newComment,
      this.newRating
    )
    .subscribe({
      next: () => {

        this.newComment = '';
        this.newRating = 0;

        // إعادة تحميل الكومنتات من الـ API
        this.loadReviews(this.restaurant.id);

        this.isSubmittingReview = false;
        this.cdr.detectChanges();
      },

      error: () => {
        this.isSubmittingReview = false;
        this.cdr.detectChanges();
      },
    });
}

get currentUserAvatar(): string {
  return this.authService.currentUser()?.profileImage || '';
}
  requestDeleteReview(review: RestaurantReview): void {
    this.reviewToDelete = review;
  }

  cancelDelete(): void {
    this.reviewToDelete = null;
  }

confirmDeleteReview(): void {

  if (!this.reviewToDelete) return;

  const reviewId = this.reviewToDelete.id;
  const token = localStorage.getItem('token') ?? '';

  this.restaurantService.deleteOwnReview(
    this.restaurant.id,
    reviewId,
    token
  ).subscribe({
    next: () => {

      this.reviews = this.reviews.filter(
        r => r.id !== reviewId
      );

      // ✅ اقفل الـ popup
      this.reviewToDelete = null;

      this.cdr.detectChanges();
    },

    error: (err) => {
      console.error(err);

      // اختياري: اقفله حتى لو حصل Error
      this.reviewToDelete = null;
    }
  });
}

  starsArray(n: number): number[] { return Array(n).fill(0); }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st'
      : day === 2 || day === 22 ? 'nd'
      : day === 3 || day === 23 ? 'rd' : 'th';
    return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
  }

  formatReviewDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}