import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FavoritesService } from '../../../core/services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

export interface HotelApiItem {
  id: number;
  name: string;
  description: string;
  location: string;
  rating: number;
  minPrice: number;
  maxPrice: number;
  mainImageUrl: string;
}

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  hotels: HotelApiItem[] = [];
  loading = false;
  pageSize = 5;
  currentPage = 1;

  private readonly apiUrl = 'http://voyagoo.runasp.net/hotels';

  constructor(
    private http: HttpClient,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.hotels.length / this.pageSize);
  }

  get pagedHotels(): HotelApiItem[] {
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

    if (this.authService.isLoggedIn()) {
      this.favoritesService.getAllFavoritesFromApi().subscribe({
        next: (res) => {
          const items = this.favoritesService.mapApiToFavoriteItems(res);
          this.favoritesService.saveFavorites(items);
          this.cdr.detectChanges();
        }
      });
    }

    this.http.get<HotelApiItem[]>(this.apiUrl).subscribe({
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

  toggleFav(event: MouseEvent, hotel: HotelApiItem): void {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }

    const isFav = this.isHotelInFav(hotel.name);

    if (isFav) {
      this.favoritesService.removeFavorite(hotel.name);
    } else {
      this.favoritesService.addToFavorites({
        title: hotel.name,
        image: hotel.mainImageUrl,
        price: hotel.minPrice + ' LE / night',
        rating: hotel.rating,
        type: 'hotel',
      });
    }
    this.cdr.detectChanges();
  }

  getPriceRange(hotel: HotelApiItem): string {
    return `${hotel.minPrice.toLocaleString()} – ${hotel.maxPrice.toLocaleString()} LE / night`;
  }
}