import { Component, OnInit } from '@angular/core';
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

  constructor(
    private restaurantService: RestaurantService,
    public  router:            Router,
  ) {}

  ngOnInit(): void {
    this.reservation = this.restaurantService.getReservation();

    if (!this.reservation) {
      this.router.navigate(['/Restaurants']);
      return;
    }

    this.restaurantService.confirmReservation().subscribe({
      next: num => {
        this.confirmationNumber = num;
        this.loading            = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d      = new Date(dateStr);
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
}