import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Restaurant } from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  restaurants: Restaurant[] = [];
  loading = true;
  pageSize = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.restaurants.length / this.pageSize);
  }

  get pagedRestaurants(): Restaurant[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.restaurants.slice(start, start + this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  constructor(
    public restaurantService: RestaurantService,
    private favoritesService: FavoritesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe({
      next: data => {
        this.restaurants = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPriceRange(r: Restaurant): string {
    return `${r.minPrice}-${r.maxPrice} LE`;
  }

  isRestaurantInFav(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  goToDetails(id: number): void {
    this.router.navigate(['restaurant/details', id]);
  }

  toggleFav(event: MouseEvent, r: Restaurant): void {
    event.stopPropagation();
    this.restaurantService.toggleFavorite(r.id);
    if (this.isRestaurantInFav(r.name)) {
      this.favoritesService.removeFavorite(r.name);
    } else {
      this.favoritesService.addToFavorites({
        title:  r.name,
        image:  r.images[0],
        price:  r.cuisine + ' • ' + this.getPriceRange(r),
        rating: r.rating,
        type:   'restaurant'
      });
    }
  }
}