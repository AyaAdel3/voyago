import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { BookingData } from '../../../core/model/hotel.model';

@Component({
  selector: 'app-hotel-booking-confirmed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-confirmed.html',
  styleUrl: './booking-confirmed.css',
})
export class BookingConfirmed implements OnInit {
  booking: BookingData | null = null;
  bookingId     = '';
  paymentMethod = 'credit';

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    private hotelService: HotelService,
  ) {}

  ngOnInit(): void {
    this.bookingId     = this.route.snapshot.queryParamMap.get('bookingId') || 'MH-0000-0000';
    this.paymentMethod = this.route.snapshot.queryParamMap.get('method')    || 'credit';
    this.booking       = this.hotelService.getBooking();

    if (!this.booking) { this.router.navigate(['/home']); }
  }

  get activeFeatures() {
    return (this.booking?.features ?? []).filter(f => f.quantity > 0);
  }

  goHome(): void { this.router.navigate(['/home']); }
}