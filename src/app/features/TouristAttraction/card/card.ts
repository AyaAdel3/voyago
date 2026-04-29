import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';
import { AttractionService, Attraction } from '../../../core/services/attraction.service';

export type { Attraction };

@Component({
  selector: 'app-tourist-attraction-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css']
})
export class TouristAttractionCard {
  attractions: Attraction[] = [];

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private attractionService: AttractionService
  ) {
    this.attractions = this.attractionService.getAll();
  }

  isFavorite(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  toggleFavorite(event: Event, attraction: Attraction) {
    event.stopPropagation();

    if (this.isFavorite(attraction.name)) {
      // ✅ بنبعت الـ name مش الـ index
      this.favoritesService.removeFavorite(attraction.name);
    } else {
      this.favoritesService.addToFavorites({
        title: attraction.name,
        image: attraction.images[0],
        price: attraction.ticketPrice + ' le / Ticket',
        rating: attraction.rating,
        type: 'attraction'  // ✅ ده اللي كان ناقص
      });
    }
  }

  goToDetails(id: number) {
    this.router.navigate(['/tourist-attraction/details', id]);
  }
}