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

  getPriceRange(r: Restaurant): string {
    return `${r.minPrice}-${r.maxPrice} LE`;
  }

  isRestaurantInFav(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  goToDetails(id: number): void {
    this.router.navigate(['restaurant/details', id]);
  }

  toggleFav(event: MouseEvent, r: any): void {
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