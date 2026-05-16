import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
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
export class TouristAttractionCard implements OnInit, OnDestroy {
  attractions: Attraction[] = [];
  isLoading = true;
  error: string | null = null;

  fallbackImage = 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=500&fit=crop';

  private sub!: Subscription;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private attractionService: AttractionService
  ) {}

  ngOnInit() {
    this.sub = this.attractionService.getAll().pipe(
      timeout(8000),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        this.attractions = data;
        // preload كل الـ details في الخلفية بعد ما الـ cards تتحمل
        data.forEach(a => this.attractionService.getById(a.id).subscribe());
      },
      error: (err) => {
        console.error('Error fetching attractions:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getImage(attraction: Attraction): string {
    return attraction.mainImageUrl ?? this.fallbackImage;
  }

  isFavorite(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  toggleFavorite(event: Event, attraction: Attraction) {
    event.stopPropagation();
    if (this.isFavorite(attraction.name)) {
      this.favoritesService.removeFavorite(attraction.name);
    } else {
      this.favoritesService.addToFavorites({
        title: attraction.name,
        image: this.getImage(attraction),
        price: 'N/A',
        rating: attraction.rating,
        type: 'attraction'
      });
    }
  }

  goToDetails(id: number) {
    this.router.navigate(['/tourist-attraction/details', id]);
  }
}