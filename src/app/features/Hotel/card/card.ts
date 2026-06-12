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
  pageSize = 5;
  currentPage = 1;

  constructor(
    public hotelService: HotelService,
    private favoritesService: FavoritesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.hotels.length / this.pageSize);
  }

  get pagedHotels(): Hotel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.hotels.slice(start, start + this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

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