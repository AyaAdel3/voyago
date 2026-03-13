import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Restaurant, RestaurantReview, TableType, ReservationData,
  AVAILABLE_TIMES,
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

  selectedDate  = '';
  selectedTime  = '';
  guestCount    = 1;
  selectedTables: TableType[] = [];
  guestName     = '';
  phone         = '';
  resError      = '';

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
      this.loadReviews(id);
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
      },
      error: () => { this.loading = false; this.error = true; this.cdr.detectChanges(); }
    });
  }

  private loadReviews(id: number): void {
    this.restaurantService.getReviews(id).subscribe({
      next: (reviews: RestaurantReview[]) => { this.reviews = reviews; this.cdr.detectChanges(); }
    });
  }

  setActiveImage(i: number): void  { this.activeImage = i; }
  openLightbox(i: number): void    { this.lbIndex = i; this.lightboxOpen = true; document.body.style.overflow = 'hidden'; }
  closeLightbox(): void            { this.lightboxOpen = false; document.body.style.overflow = ''; }
  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.lbIndex < this.restaurant.images.length - 1) this.lbIndex++; }

  changeGuests(delta: number): void {
    this.guestCount = Math.max(1, this.guestCount + delta);
    if (this.resError) this.tryCleanError();
  }

  changeTable(i: number, delta: number): void {
    this.selectedTables[i].quantity = Math.max(0, this.selectedTables[i].quantity + delta);
    if (this.resError) this.tryCleanError();
  }

  private tryCleanError(): void {
    if (
      this.selectedDate &&
      this.selectedTime &&
      this.guestName.trim() &&
      this.phone.trim()
    ) this.resError = '';
  }

  makeReservation(): void {
    if (!this.selectedDate) { this.resError = 'Please select a date.'; return; }
    if (!this.selectedTime) { this.resError = 'Please select a time.'; return; }
    if (!this.guestName.trim()) { this.resError = 'Please enter your name.'; return; }
    if (!this.phone.trim())     { this.resError = 'Please enter your phone number.'; return; }

    this.resError = '';

    const data: ReservationData = {
      restaurantId:   this.restaurant.id,
      restaurantName: this.restaurant.name,
      date:           this.selectedDate,
      time:           this.selectedTime,
      guestCount:     this.guestCount,
      tables:         this.selectedTables.filter(t => t.quantity > 0),
      guestName:      this.guestName,
      phone:          this.phone,
      totalAmount:    0,
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
    return `${months[d.getMonth()]} ${day}${suffix},${d.getFullYear()}`;
  }
}