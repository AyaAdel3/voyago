import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TourGuideBookingData } from '../booking/booking';

@Component({
  selector: 'app-tour-guide-booking-confirmed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-confirmed.html',
  styleUrl: './booking-confirmed.css',
})
export class BookingConfirmed implements OnInit {
  booking: TourGuideBookingData | null = null;
  bookingId     = '';
  paymentMethod = 'credit';

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // الـ bookingId والـ method بييجوا من الـ queryParams اللي بعتهم booking.ts
    this.bookingId     = this.route.snapshot.queryParamMap.get('bookingId') || 'TG-0000';
    this.paymentMethod = this.route.snapshot.queryParamMap.get('method')    || 'credit';

    const raw = sessionStorage.getItem('tourGuideBooking');
    if (raw) {
      this.booking = JSON.parse(raw);
      sessionStorage.removeItem('tourGuideBooking');
    } else {
      this.router.navigate(['/home']);
    }
  }

  goHome(): void { this.router.navigate(['/home']); }
}