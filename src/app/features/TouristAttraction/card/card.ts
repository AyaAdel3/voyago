import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';

import { FavoritesService } from '../../../core/services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';
import {
  AttractionService,
  Attraction
} from '../../../core/services/attraction.service';

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
  pageSize = 5;
  currentPage = 1;

  fallbackImage =
    'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=500&fit=crop';

  private sub!: Subscription;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private attractionService: AttractionService,
    private cdr: ChangeDetectorRef
  ) {}

  get totalPages(): number {
    return Math.ceil(this.attractions.length / this.pageSize);
  }

  get pagedAttractions(): Attraction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.attractions.slice(start, start + this.pageSize);
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
    this.isLoading = true;

    if (this.authService.isLoggedIn()) {
      this.favoritesService.getAllFavoritesFromApi().subscribe({
        next: (res) => {
          const items = this.favoritesService.mapApiToFavoriteItems(res);
          this.favoritesService.saveFavorites(items);
          this.cdr.detectChanges();
        }
      });
    }

    this.sub = this.attractionService.getAll().pipe(
      timeout(8000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.attractions = data;
        data.forEach(a => {
          this.attractionService.getById(a.id).subscribe();
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching attractions:', err);
        this.error = 'Failed to load attractions. Please try again.';
        this.cdr.detectChanges();
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

  toggleFavorite(event: Event, attraction: Attraction): void {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }

    const isFav = this.isFavorite(attraction.name);

    this.attractionService.toggleFavoriteApi(attraction.id).subscribe({
      next: () => {
        if (isFav) {
          this.favoritesService.removeFavorite(attraction.name);
        } else {
          this.favoritesService.addToFavorites({
            title:  attraction.name,
            image:  this.getImage(attraction),
            price:  'N/A',
            rating: attraction.rating,
            type:   'attraction'
          });
        }
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to toggle favorite:', err),
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/tourist-attraction/details', id]);
  }
}