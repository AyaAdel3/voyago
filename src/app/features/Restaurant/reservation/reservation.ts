// ============================================================
// reservation.ts  →  src/app/features/Restaurant/reservation/
// صفحة تأكيد الحجز بعد الـ reservation
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationData } from '../../../core/model/restaurant.model';
import { RestaurantService }  from '../../../core/services/resturant.service';

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

  constructor(
    private restaurantService: RestaurantService,
    public  router:            Router,
  ) {}

  ngOnInit(): void {
    // جيب الـ reservation data من الـ service
    this.reservation = this.restaurantService.getReservation();

    if (!this.reservation) {
      // لو مفيش data، ارجع للريستورانتات
      this.router.navigate(['/Restaurants']);
      return;
    }

    // Confirm الحجز واحصل على confirmation number
    this.restaurantService.confirmReservation().subscribe({
      next: num => {
        this.confirmationNumber = num;
        this.loading            = false;
      }
    });
  }

  /** فورمات التاريخ: 2025-03-16 → Saturday, March 16, 2026 */
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d    = new Date(dateStr);
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  /** فورمات الوقت: "18:00" → "6:00 PM - 8:00 PM" */
  formatTimeRange(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const startAmPm = h < 12 ? 'AM' : 'PM';
    const startH    = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const endH_raw  = h + 2;
    const endAmPm   = endH_raw < 12 ? 'AM' : 'PM';
    const endH      = endH_raw > 12 ? endH_raw - 12 : endH_raw;
    return `${startH}:${m.toString().padStart(2,'0')} ${startAmPm} - ${endH}:${m.toString().padStart(2,'0')} ${endAmPm}`;
  }
}