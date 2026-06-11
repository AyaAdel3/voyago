import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Hotel, Review, RoomType, HotelFeature, BookingData, BOARD_FEATURE_NAMES,
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
  hotel!: Hotel;
  reviews: Review[] = [];
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
  reviewToDelete: Review | null = null;

  newComment  = '';
  newRating   = 0;
  submitting  = false;

  activeImage  = 0;
  lightboxOpen = false;
  lbIndex      = 0;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    private hotelService: HotelService,
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
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!id || isNaN(id)) { this.router.navigate(['/hotels']); return; }
      this.loading = true;
      this.error   = false;
      this.hotel   = null!;
      this.cdr.detectChanges();
      this.loadHotel(id);
      this.loadReviews(id);
    });
  }

  private loadHotel(id: number): void {
    this.hotelService.getHotelById(id).subscribe({
      next: (hotel: Hotel | undefined) => {
        if (!hotel) { this.router.navigate(['/hotels']); return; }
        this.hotel         = hotel;
        this.selectedRooms = this.hotelService.getDefaultRooms(hotel);

        this.hotelService.getFeatures().subscribe(allFeatures => {
          this.selectedFeatures = this.hotelService.getHotelFeatures(hotel, allFeatures);
          this.recalc();
          this.cdr.detectChanges();
        });

        this.loading = false;
        this.error   = false;
        this.cdr.detectChanges();
        this.recalc();
      },
      error: () => { this.loading = false; this.error = true; this.cdr.detectChanges(); }
    });
  }

  private loadReviews(id: number): void {
    this.hotelService.getReviews(id).subscribe({
      next: (reviews: Review[]) => { this.reviews = reviews; this.cdr.detectChanges(); }
    });
  }

  // ── Auth ──────────────────────────────────────────────

  get currentUserName(): string {
    return this.authService.getFullName() || 'Guest';
  }

  goToLogin(): void {
    this.showLoginPrompt = false;
    this.authModal.openLogin();
  }

  // ── Computed ──────────────────────────────────────────

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
    return this.hotel?.serviceChargePct ?? 0;
  }

  private isBoard(f: HotelFeature): boolean {
    return BOARD_FEATURE_NAMES.includes(f.name);
  }

  // ── Gallery ───────────────────────────────────────────

  setActiveImage(i: number): void { this.activeImage = i; }
  openLightbox(i: number): void   { this.lbIndex = i; this.lightboxOpen = true; document.body.style.overflow = 'hidden'; }
  closeLightbox(): void           { this.lightboxOpen = false; document.body.style.overflow = ''; }
  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.lbIndex < this.hotel.images.length - 1) this.lbIndex++; }

  // ── Price calculation ─────────────────────────────────

  recalc(): void {
    this.nights = calcNights(this.checkIn, this.checkOut);

    const hasDate = !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn);

    const roomsCost    = this.selectedRooms.reduce((s, r) => s + r.price * r.quantity, 0);
    const featuresCost = this.selectedFeatures.reduce((s, f) => s + f.price * f.quantity, 0);

    this.basePrice = hasDate ? roomsCost * this.nights : 0;
    const subtotal = this.basePrice + (hasDate ? featuresCost : 0);

    // Service charge — dynamic from hotel (0 means no service charge)
    const svcPct          = this.hotelServiceChargePct;
    this.serviceCharge    = hasDate && svcPct > 0
      ? Math.round(subtotal * (svcPct / 100))
      : 0;

    // Discount
    const discountPct    = this.hotelDiscount;
    this.discountAmount  = hasDate && discountPct > 0
      ? Math.round(subtotal * (discountPct / 100))
      : 0;

    this.totalAmount = hasDate
      ? subtotal + this.serviceCharge - this.discountAmount
      : 0;
  }

  // ── Rooms ─────────────────────────────────────────────

  changeRoom(i: number, delta: number): void {
    this.selectedRooms[i].quantity = Math.max(0, this.selectedRooms[i].quantity + delta);
    const max = this.totalRoomsSelected;

    let boardOverflow = this.totalBoardSelected - max;
    if (boardOverflow > 0) {
      for (let j = this.selectedFeatures.length - 1; j >= 0 && boardOverflow > 0; j--) {
        if (!this.isBoard(this.selectedFeatures[j])) continue;
        const remove = Math.min(this.selectedFeatures[j].quantity, boardOverflow);
        this.selectedFeatures[j].quantity -= remove;
        boardOverflow -= remove;
      }
    }
    for (const f of this.selectedFeatures) {
      if (this.isBoard(f)) continue;
      if (f.quantity > max) f.quantity = max;
    }

    if (this.canClearError()) this.bookingError = '';
    this.recalc();
  }

  // ── Features ──────────────────────────────────────────

  canIncrement(f: HotelFeature): boolean {
    if (this.totalRoomsSelected === 0) return false;
    return this.isBoard(f)
      ? this.totalBoardSelected < this.totalRoomsSelected
      : f.quantity < this.totalRoomsSelected;
  }

  changeFeature(i: number, delta: number): void {
    const f      = this.selectedFeatures[i];
    const newVal = f.quantity + delta;
    if (newVal < 0) return;
    if (delta > 0 && !this.canIncrement(f)) return;
    f.quantity = newVal;
    this.recalc();
  }

  // ── Validation ────────────────────────────────────────

  private canClearError(): boolean {
    return (
      this.selectedRooms.some(r => r.quantity > 0) &&
      !!this.checkIn && !!this.checkOut &&
      new Date(this.checkOut) > new Date(this.checkIn)
    );
  }

  onDateChange(): void {
    if (this.canClearError()) this.bookingError = '';
    this.recalc();
  }

  bookNow(): void {
    if (this.authService.isAdmin()) {
      this.authService.logout();
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return;
    }

    const selectedRooms = this.selectedRooms.filter(r => r.quantity > 0);
    if (selectedRooms.length === 0)                         { this.bookingError = 'Please select at least one room to continue.'; return; }
    if (!this.checkIn || !this.checkOut)                    { this.bookingError = 'Please select check-in and check-out dates.'; return; }
    if (new Date(this.checkOut) <= new Date(this.checkIn))  { this.bookingError = 'Check-out date must be after check-in date.'; return; }

    this.bookingError = '';
    const bookingData: BookingData = {
      hotelId: this.hotel.id, hotelName: this.hotel.name,
      checkIn: this.checkIn,  checkOut: this.checkOut,
      rooms: selectedRooms,   features: this.selectedFeatures,
      totalNights: this.nights, discount: this.hotelDiscount,
      serviceCharge: this.serviceCharge, totalAmount: this.totalAmount,
    };
    this.hotelService.setBooking(bookingData);
    this.router.navigate(['/hotels/booking']);
  }

  // ── Reviews ───────────────────────────────────────────

  isMyReview(review: Review): boolean {
    if (review.userName === 'You') return true;
    const fullName = this.authService.getFullName()?.trim();
    return !!fullName && review.userName?.trim() === fullName;
  }

  submitReview(): void {
    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }

    if (!this.newComment.trim() || this.newRating === 0 || this.submitting) return;
    this.submitting = true;

    this.hotelService.submitReview(this.hotel.id, this.newComment, this.newRating)
      .subscribe({
        next: () => {
          this.newComment = '';
          this.newRating  = 0;
          this.submitting = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
  }

  requestDeleteReview(review: Review): void {
    this.reviewToDelete = review;
  }

  cancelDelete(): void {
    this.reviewToDelete = null;
  }

  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;
    this.hotelService.deleteReview(this.reviewToDelete.id);
    this.reviewToDelete = null;
    this.cdr.detectChanges();
  }

  starsArray(n: number): number[] { return Array(n).fill(0); }

  formatReviewDate(dateStr: string): string {
    if (!dateStr) return '';
    const d      = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}