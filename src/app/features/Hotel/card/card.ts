import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  hotels: Hotel[] = [];
  loading = false;

  constructor(
    public hotelService: HotelService,
    private favoritesService: FavoritesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loading = true;

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

  isHotelInFav(hotelName: string): boolean {
    return this.favoritesService.isFavorite(hotelName);
  }

  goToDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  toggleFav(event: MouseEvent, hotel: any): void {
    event.stopPropagation();

    if (this.isHotelInFav(hotel.name)) {
      this.favoritesService.removeFavorite(hotel.name);
    } else {
      this.favoritesService.addToFavorites({
        title: hotel.name,
        image: hotel.images[0],
        price: hotel.pricePerNight + 'le for 1 night',
        rating: hotel.rating,
        type: 'hotel',
      });
    }
  }
}