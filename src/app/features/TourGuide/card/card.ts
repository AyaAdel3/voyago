import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Details } from '../details/details';
import { FavoritesService } from '../../../core/services/favorites.service';
import { TourGuideService, TourGuide } from '../../../core/services/tour-guide.service';

export type { TourGuide };

@Component({
  selector: 'app-tour-guide-card',
  standalone: true,
  imports: [CommonModule, Details],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit {
  guides: TourGuide[] = [];
  loading = true;
  selectedGuide: TourGuide | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private tourGuideService: TourGuideService
  ) {}

  ngOnInit(): void {
    this.guides = this.tourGuideService.getActive();
    this.loading = false;
  }

  isGuideInFav(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  toggleFav(event: MouseEvent, guide: TourGuide): void {
    event.stopPropagation();

    if (this.isGuideInFav(guide.name)) {
      // ✅ بنبعت الـ name مش الـ index
      this.favoritesService.removeFavorite(guide.name);
    } else {
      this.favoritesService.addToFavorites({
        title: guide.name,
        image: guide.image,
        price: guide.pricePerDay + ' LE / day',
        rating: guide.rating,
        type: 'tourGuide'  // ✅ ده اللي كان ناقص
      });
    }
  }

  openDetails(guide: TourGuide): void { this.selectedGuide = guide; }
  closeDetails(): void { this.selectedGuide = null; }
}