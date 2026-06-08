import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationData } from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class Reservation implements OnInit {
  reservation: ReservationData | null = null;
  confirmationNumber = '';
  loading = true;
  error = false;

  constructor(
    private restaurantService: RestaurantService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const stored = sessionStorage.getItem('pendingReservation');

    if (!stored) {
      this.router.navigate(['/Restaurants']);
      return;
    }

    this.reservation = JSON.parse(stored) as ReservationData;

    // تحديث فوري للواجهة
    this.cdr.detectChanges();

    this.restaurantService.confirmReservation(this.reservation).subscribe({
      next: (num) => {
        this.confirmationNumber = num;
        this.loading = false;

        // إجبار Angular يعمل render
        this.cdr.detectChanges();

        sessionStorage.removeItem('pendingReservation');
      },
      error: (err) => {
        console.error('Reservation Error:', err);

        this.loading = false;
        this.error = true;

        // إجبار Angular يعمل render
        this.cdr.detectChanges();

        sessionStorage.removeItem('pendingReservation');
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}