import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  hotels: Hotel[] = [];
  loading = true;

  constructor(
    public hotelService: HotelService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe({
      next: (data) => {
        this.hotels = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  toggleFav(event: MouseEvent, hotelId: number): void {
    event.stopPropagation();
    this.hotelService.toggleFavorite(hotelId);
  }
}