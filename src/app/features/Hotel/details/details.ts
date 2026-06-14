import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  RoomType, HotelFeature, BookingData, BOARD_FEATURE_NAMES,
  HotelApiDetail, HotelApiComment,
} from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
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
  basePrice      = 0;
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
        // ✅ نجيب الـ comments من الـ detail response مباشرة في أول load
        this.reviews = hotel.comments ?? [];

        this.selectedRooms = [
          { type: 'Single', price: hotel.singlePrice, quantity: 0 },
          { type: 'Double', price: hotel.doublePrice, quantity: 0 },
          { type: 'Triple', price: hotel.triplePrice, quantity: 0 },
          { type: 'Suite',  price: hotel.suitePrice,  quantity: 0 },
        ];

        this.selectedFeatures = [];
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

  // ✅ زي الريستورنت بالظبط: reload الـ comments من الـ API بعد add أو أي تغيير
  private loadReviews(id: number): void {
    this.hotelService.getComments(id).subscribe({
      next: (reviews: HotelApiComment[]) => {
        console.log('LOADED REVIEWS:', reviews);
        this.reviews = reviews;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
      },
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

  get hotelDiscount(): number         { return 0; }
  get hotelServiceChargePct(): number { return 0; }

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

  recalc(): void {
    this.nights = calcNights(this.checkIn, this.checkOut);
    const hasDate = !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn);

    const roomsCost    = this.selectedRooms.reduce((s, r) => s + r.price * r.quantity, 0);
    const featuresCost = this.selectedFeatures.reduce((s, f) => s + f.price * f.quantity, 0);

    this.basePrice      = hasDate ? roomsCost * this.nights : 0;
    const subtotal      = this.basePrice + (hasDate ? featuresCost : 0);
    this.serviceCharge  = 0;
    this.discountAmount = 0;
    this.totalAmount    = hasDate ? subtotal : 0;
  }

  changeRoom(i: number, delta: number): void {
    if (!this.checkAuthBeforeInteract()) return;
    this.selectedRooms[i].quantity = Math.max(0, this.selectedRooms[i].quantity + delta);
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

  bookNow(): void {
    if (!this.checkAuthBeforeInteract()) return;

    const selectedRooms = this.selectedRooms.filter(r => r.quantity > 0);
    if (selectedRooms.length === 0)                        { this.bookingError = 'Please select at least one room to continue.'; return; }
    if (!this.checkIn || !this.checkOut)                   { this.bookingError = 'Please select check-in and check-out dates.'; return; }
    if (new Date(this.checkOut) <= new Date(this.checkIn)) { this.bookingError = 'Check-out date must be after check-in date.'; return; }

    this.bookingError = '';
    const bookingData: BookingData = {
      hotelId:       this.hotel.id,
      hotelName:     this.hotel.name,
      checkIn:       this.checkIn,
      checkOut:      this.checkOut,
      rooms:         selectedRooms,
      features:      this.selectedFeatures,
      totalNights:   this.nights,
      discount:      0,
      serviceCharge: 0,
      totalAmount:   this.totalAmount,
    };
    this.hotelService.setBooking(bookingData);
    this.router.navigate(['/hotels/booking']);
  }

  // ── Reviews ───────────────────────────────────────────────

  isMyReview(review: HotelApiComment): boolean {
    const fullName = this.authService.getFullName()?.trim();
    return !!fullName && review.userName?.trim() === fullName;
  }

  // ✅ زي الريستورنت بالظبط:
  //    1. POST لإضافة الـ comment
  //    2. بعد النجاح → loadReviews من الـ API علشان نجيب الـ id الصح والبيانات الكاملة
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
          // ✅ reload من الـ API علشان الـ review يظهر بـ id صح ويتعمله delete
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

  // ✅ زي الريستورنت بالظبط:
  //    1. DELETE request للـ API
  //    2. بعد النجاح → filter محلي بدون API call تاني
  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;

    const commentId = this.reviewToDelete.id;

    this.hotelService.deleteComment(this.hotel.id, commentId).subscribe({
      next: () => {
        // ✅ filter محلي — مش محتاجين نعمل reload كامل
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