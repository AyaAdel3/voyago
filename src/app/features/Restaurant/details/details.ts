import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Restaurant, RestaurantReview, TableType, ReservationData,
  AVAILABLE_TIMES, Feature,
} from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';

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
  error   = false;

  selectedDate    = '';
  selectedTables: TableType[] = [];
  guestName       = '';
  phone           = '';
  resError        = '';

  todayStr = new Date().toISOString().split('T')[0];

  availableTimes = AVAILABLE_TIMES;

  newComment = '';
  newRating  = 0;

  activeImage  = 0;
  lightboxOpen = false;
  lbIndex      = 0;

  constructor(
    private route:             ActivatedRoute,
    public  router:            Router,
    private restaurantService: RestaurantService,
    private cdr:               ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (!id || isNaN(id)) { this.router.navigate(['/Restaurants']); return; }
      this.loading = true;
      this.error   = false;
      this.restaurant = null!;
      this.cdr.detectChanges();
      this.loadRestaurant(id);
    });
  }

  private loadRestaurant(id: number): void {
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (r: Restaurant | undefined) => {
        if (!r) { this.router.navigate(['/Restaurants']); return; }
        this.restaurant     = r;
        this.selectedTables = this.restaurantService.getDefaultTables();
        this.loading        = false;
        this.cdr.detectChanges();

        // جيب الـ reviews بعد ما الـ restaurant اتحمل
        this.loadReviews(id);
      },
      error: () => { this.loading = false; this.error = true; this.cdr.detectChanges(); }
    });
  }

  private loadReviews(id: number): void {
    this.restaurantService.getReviews(id).subscribe({
      next: (reviews: RestaurantReview[]) => {
        this.reviews = reviews;
        this.cdr.detectChanges();
      }
    });
  }

  // الـ features جاية مع الـ restaurant مباشرة من الـ API
  getFeatureLabel(id: number): Feature | null {
    return this.restaurant?.features?.find(f => f.id === id) ?? null;
  }

  getPriceRange(): string {
    return `${this.restaurant.minPrice}-${this.restaurant.maxPrice} LE`;
  }

  setActiveImage(i: number): void  { this.activeImage = i; }
  openLightbox(i: number): void    { this.lbIndex = i; this.lightboxOpen = true; document.body.style.overflow = 'hidden'; }
  closeLightbox(): void            { this.lightboxOpen = false; document.body.style.overflow = ''; }
  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.lbIndex < this.restaurant.images.length - 1) this.lbIndex++; }

  changeTable(i: number, delta: number): void {
    this.selectedTables[i].quantity = Math.max(0, this.selectedTables[i].quantity + delta);
    if (this.resError) this.tryCleanError();
  }

  private tryCleanError(): void {
    if (this.selectedDate && this.guestName.trim() && this.phone.trim()) this.resError = '';
  }

  formatPhone(): void {
    this.phone = this.phone.replace(/\D/g, '').substring(0, 11);
    if (this.resError) this.tryCleanError();
  }

  makeReservation(): void {
    if ((this.restaurant as any).status === 'Inactive') {
      this.resError = 'This restaurant is currently not available for reservations.';
      return;
    }
    if (!this.selectedDate)     { this.resError = 'Please select a date.'; return; }
    if (!this.guestName.trim()) { this.resError = 'Please enter your name.'; return; }
    if (!this.phone.trim())     { this.resError = 'Please enter your phone number.'; return; }

    const validPrefixes = ['010', '011', '012', '015'];
    const cleanPhone    = this.phone.replace(/\D/g, '');
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

  submitReview(): void {
    if (!this.newComment.trim() || this.newRating === 0) return;
    this.restaurantService.submitReview(this.restaurant.id, this.newComment, this.newRating).subscribe({
      next: (review: RestaurantReview) => {
        this.reviews    = [review, ...this.reviews];
        this.newComment = '';
        this.newRating  = 0;
        this.cdr.detectChanges();
      },
    });
  }

  starsArray(n: number): number[] { return Array(n).fill(0); }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d      = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day    = d.getDate();
    const suffix = day===1||day===21||day===31 ? 'st' : day===2||day===22 ? 'nd' : day===3||day===23 ? 'rd' : 'th';
    return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
  }

  formatReviewDate(dateStr: string): string {
    if (!dateStr) return '';
    const d      = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}