// ============================================================
// booking-confirmed.ts  →  src/app/features/TourGuide/booking-confirmed/
// صفحة التأكيد بعد إتمام حجز التور جايد
// ============================================================

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
    // جيب الـ params من الـ URL
    this.paymentMethod = this.route.snapshot.queryParamMap.get('method') || 'credit';

    // ولد booking ID عشوائي
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.bookingId = 'TG-' +
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') + '-' +
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    // جيب البيانات من الـ sessionStorage
    const raw = sessionStorage.getItem('tourGuideBooking');
    if (raw) {
      this.booking = JSON.parse(raw);
      // امسح بعد ما قرأت
      sessionStorage.removeItem('tourGuideBooking');
    } else {
      this.router.navigate(['/home']);
    }
  }

  goHome(): void { this.router.navigate(['/home']); }
}