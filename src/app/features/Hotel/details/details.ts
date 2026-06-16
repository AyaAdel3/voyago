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

// سطر واحد في الـ Price breakdown
export interface PriceLine {
  label:  string;
  amount: number;
}

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
  loading = true;
  error   = false;

  checkIn  = '';
  checkOut = '';
  nights   = 0;
  selectedRooms: RoomType[]        = [];
  selectedFeatures: HotelFeature[] = [];

  // Price breakdown lines (للعرض في الـ widget)
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
  bookingResult: CreateBookingResponse | null = null;
  showBookingConfirm = false;

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

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!id || isNaN(id)) { this.router.navigate(['/hotels']); return; }
      this.loading = true;
      this.error   = false;
      this.hotel   = null!;
      this.cdr.detectChanges();
      this.loadHotel(id);
    });
  }

 private loadHotel(id: number): void {
    this.hotelService.getHotelApiById(id).subscribe({
      next: (hotel) => {
        this.hotel   = hotel;
        this.reviews = hotel.comments ?? [];

        this.selectedRooms = [
          { type: 'Single', price: hotel.singlePrice, quantity: 0 },
          { type: 'Double', price: hotel.doublePrice, quantity: 0 },
          { type: 'Triple', price: hotel.triplePrice, quantity: 0 },
          { type: 'Suite',  price: hotel.suitePrice,  quantity: 0 },
        ];

        // بناء selectedFeatures من hotel.bookingFeatures
        // Full Board (id: 1001) → fullBoardRooms في الـ payload
        // Half Board (id: 1002) → halfBoardRooms في الـ payload
        // الباقي                → extraFeatures في الـ payload
        this.selectedFeatures = (hotel.bookingFeatures ?? []).map((f: HotelApiBookingFeature) => ({
          id:       f.id,
          name:     f.name,
          icon:     f.icon,
          price:    f.price,
          selected: false,
          quantity: 0,
        }));

        this.loading = false;
        this.error   = false;
        this.recalc();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error   = true;
        this.cdr.detectChanges();
      },
    });
  }

  private loadReviews(id: number): void {
    this.hotelService.getComments(id).subscribe({
      next: (reviews: HotelApiComment[]) => {
        this.reviews = reviews;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load reviews:', err),
    });
  }

  // ── Images ────────────────────────────────────────────────

  get hotelImages(): string[] {
    return this.hotel?.images?.map(img => img.imageUrl) ?? [];
  }

  // ── Auth ──────────────────────────────────────────────────

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

  // ── Booking helpers ───────────────────────────────────────

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

  // ── Gallery ───────────────────────────────────────────────

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

  // ── Price calc ────────────────────────────────────────────
  // بيحسب كل line item على حدة ويبنيهم في priceLines
  // عشان يتعرضوا في الـ widget زي الصورة

  recalc(): void {
    this.nights = calcNights(this.checkIn, this.checkOut);
    const hasDate = !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn);

    this.priceLines    = [];
    this.serviceCharge  = 0;
    this.discountAmount = 0;
    this.totalAmount    = 0;

    if (!hasDate) return;

    // ── Rooms line: "N Night(s) — XLE" ───────────────────
    const roomsCostPerNight = this.selectedRooms.reduce((s, r) => s + r.price * r.quantity, 0);
    const roomsTotal        = roomsCostPerNight * this.nights;

    if (roomsTotal > 0) {
      this.priceLines.push({
        label:  `${this.nights} Night${this.nights !== 1 ? 's' : ''}`,
        amount: roomsTotal,
      });
    }

    // ── Feature lines: "FeatureName × qty — XLE" ─────────
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

    // ── Discount ──────────────────────────────────────────
    this.discountAmount = this.hotelDiscount > 0
      ? Math.round(subtotal * this.hotelDiscount / 100)
      : 0;

    const afterDiscount = subtotal - this.discountAmount;

    // ── Service charge ────────────────────────────────────
    this.serviceCharge = this.hotelServiceChargePct > 0
      ? Math.round(afterDiscount * this.hotelServiceChargePct / 100)
      : 0;

    this.totalAmount = afterDiscount + this.serviceCharge;
  }

  changeRoom(i: number, delta: number): void {
    if (!this.checkAuthBeforeInteract()) return;
    this.selectedRooms[i].quantity = Math.max(0, this.selectedRooms[i].quantity + delta);
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

  onDateChange(): void {
    if (!this.checkAuthBeforeInteract()) {
      this.checkIn  = '';
      this.checkOut = '';
      return;
    }
    if (this.canClearError()) this.bookingError = '';
    this.recalc();
  }

  private canClearError(): boolean {
    return (
      this.selectedRooms.some(r => r.quantity > 0) &&
      !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn)
    );
  }

  // ── Book Now ──────────────────────────────────────────────

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
        this.bookingResult      = res;
        this.showBookingConfirm = true;
        this.bookingSubmitting  = false;
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

  closeBookingConfirm(): void {
    this.showBookingConfirm = false;
    this.bookingResult = null;
  }

  // ── Reviews ───────────────────────────────────────────────

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