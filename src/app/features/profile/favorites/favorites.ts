import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService, FavoriteItem } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent implements OnInit {

  hotels:             FavoriteItem[] = [];
  restaurants:        FavoriteItem[] = [];
  tourGuides:         FavoriteItem[] = [];
  touristAttractions: FavoriteItem[] = [];

  isLoading = true;

  sliderIndex: { [key: string]: number } = {
    hotels:             0,
    restaurants:        0,
    tourGuides:         0,
    touristAttractions: 0,
  };

  constructor(
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.favoritesService.getAllFavoritesFromApi().subscribe({
      next: (res) => {
        const items = this.favoritesService.mapApiToFavoriteItems(res);
        this.favoritesService.saveFavorites(items);
        this.splitItems(items);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.splitItems(this.favoritesService.getFavorites());
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private splitItems(items: FavoriteItem[]): void {
    this.hotels             = items.filter(f => f.type === 'hotel');
    this.restaurants        = items.filter(f => f.type === 'restaurant');
    this.tourGuides         = items.filter(f => f.type === 'tourGuide');
    this.touristAttractions = items.filter(f => f.type === 'attraction');
  }

  deleteFav(item: FavoriteItem): void {
    if (!item.id) {
      // fallback لو مفيش id
      this.favoritesService.removeFavorite(item.title);
      this.splitItems(this.favoritesService.getFavorites());
      this.fixSliderIndexes();
      this.cdr.detectChanges();
      return;
    }

    this.favoritesService.toggleFavoriteApi(item.type, item.id).subscribe({
      next: () => {
        this.favoritesService.removeFavorite(item.title);
        this.splitItems(this.favoritesService.getFavorites());
        this.fixSliderIndexes();
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to remove favorite:', err)
    });
  }

  private fixSliderIndexes(): void {
    const keys = ['hotels', 'restaurants', 'tourGuides', 'touristAttractions'];
    keys.forEach(k => {
      const arr = (this as any)[k] as FavoriteItem[];
      if (this.sliderIndex[k] >= arr.length && arr.length > 0) {
        this.sliderIndex[k] = arr.length - 1;
      } else if (arr.length === 0) {
        this.sliderIndex[k] = 0;
      }
    });
  }

  currentItem(section: string): FavoriteItem | null {
    const arr = (this as any)[section] as FavoriteItem[];
    return arr[this.sliderIndex[section]] ?? null;
  }

  next(section: string): void {
    const arr = (this as any)[section] as FavoriteItem[];
    if (this.sliderIndex[section] < arr.length - 1) {
      this.sliderIndex[section]++;
    }
  }

  prev(section: string): void {
    if (this.sliderIndex[section] > 0) {
      this.sliderIndex[section]--;
    }
  }

  canNext(section: string): boolean {
    const arr = (this as any)[section] as FavoriteItem[];
    return this.sliderIndex[section] < arr.length - 1;
  }

  canPrev(section: string): boolean {
    return this.sliderIndex[section] > 0;
  }
}