import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Hotel, Review, RoomType, HotelFeature, BookingData,
} from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / 86_400_000));
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
  error = false;

  // Booking
  checkIn  = '';
  checkOut = '';
  nights   = 1;
  selectedRooms: RoomType[] = [];
  selectedFeatures: HotelFeature[] = [];
  basePrice = 0;
  discount = 0;
  serviceCharge = 750;
  totalAmount = 0;

  // Review form
  newComment = '';
  newRating = 5;

  // Gallery
  activeImage = 0;
  lightboxOpen = false;
  lbIndex = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private hotelService: HotelService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      console.log('>>> params:', params);
      console.log('>>> parsed id:', id);

      if (!id || isNaN(id)) {
        console.warn('Invalid id, redirecting...');
        this.router.navigate(['/hotels']);
        return;
      }

      this.loading = true;
      this.error = false;
      this.hotel = null!;
      this.cdr.detectChanges();
      this.loadHotel(id);
      this.loadReviews(id);
    });
  }

  private loadHotel(id: number): void {
    this.hotelService.getHotelById(id).subscribe({
      next: hotel => {
        console.log('>>> hotel response:', hotel);

        if (!hotel) {
          console.warn('Hotel is null/undefined, redirecting...');
          this.router.navigate(['/hotels']);
          return;
        }

        this.hotel = hotel;
        this.selectedRooms    = this.hotelService.getDefaultRooms();
        this.selectedFeatures = this.hotelService.getDefaultFeatures();
        this.loading = false;
        this.error = false;
        this.cdr.detectChanges();
        this.recalc();
      },
      error: (err) => {
        console.error('>>> loadHotel error:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadReviews(id: number): void {
    this.hotelService.getReviews(id).subscribe({
      next: reviews => {
        this.reviews = reviews;
        this.cdr.detectChanges();
      }
    });
  }

  // Gallery methods
  setActiveImage(index: number): void { this.activeImage = index; }
  openLightbox(index: number): void   { this.lbIndex = index; this.lightboxOpen = true; document.body.style.overflow = 'hidden'; }
  closeLightbox(): void               { this.lightboxOpen = false; document.body.style.overflow = ''; }
  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.lbIndex < this.hotel.images.length - 1) this.lbIndex++; }

  // Booking methods
  recalc(): void {
    this.nights = calcNights(this.checkIn, this.checkOut);
    const rooms    = this.selectedRooms.reduce((s, r) => s + r.price * r.quantity, 0);
    const features = this.selectedFeatures.filter(f => f.selected).reduce((s, f) => s + f.price, 0);
    this.basePrice   = (this.hotel?.pricePerNight ?? 150) * this.nights + rooms;
    this.discount    = Math.round(this.basePrice * 0.2);
    this.totalAmount = this.basePrice - this.discount + features + this.serviceCharge;
  }

  changeRoom(i: number, delta: number): void {
  this.selectedRooms[i].quantity = Math.max(0, this.selectedRooms[i].quantity + delta);
  
  // لو في room محددة امسح الـ error
  if (this.selectedRooms.some(r => r.quantity > 0)) {
    this.bookingError = '';
  }
  
  this.recalc();
}

  toggleFeature(i: number, val: boolean): void {
    this.selectedFeatures[i].selected = val;
    this.recalc();
  }

  bookingError = '';  // ← أضيف ده مع باقي الـ variables

bookNow(): void {
  const selectedRooms = this.selectedRooms.filter(r => r.quantity > 0);

  if (selectedRooms.length === 0) {
    this.bookingError = 'Please select at least one room to continue.';
    return;
  }

  this.bookingError = '';  // امسح الـ error لو اختار room

  const bookingData: BookingData = {
    hotelId:       this.hotel.id,
    hotelName:     this.hotel.name,
    checkIn:       this.checkIn,
    checkOut:      this.checkOut,
    rooms:         selectedRooms,
    features:      this.selectedFeatures,
    totalNights:   this.nights,
    discount:      this.discount,
    serviceCharge: this.serviceCharge,
    totalAmount:   this.totalAmount,
  };

  this.hotelService.setBooking(bookingData);
  this.router.navigate(['/hotels/booking']);
}
  submitReview(): void {
    if (!this.newComment.trim()) return;
    this.hotelService.submitReview(this.hotel.id, this.newComment, this.newRating).subscribe({
      next: review => {
        this.reviews    = [review, ...this.reviews];
        this.newComment = '';
        this.newRating  = 5;
        this.cdr.detectChanges();
      },
    });
  }

  starsArray(n: number): number[] { return Array(n).fill(0); }
  
}