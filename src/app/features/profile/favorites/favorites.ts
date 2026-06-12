import { Component, OnInit } from '@angular/core';
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
  hotels: FavoriteItem[] = [];
  restaurants: FavoriteItem[] = [];
  tourGuides: FavoriteItem[] = [];
  touristAttractions: FavoriteItem[] = [];

  // ── Slider indexes ──────────────────────────────────
  sliderIndex: { [key: string]: number } = {
    hotels: 0,
    restaurants: 0,
    tourGuides: 0,
    touristAttractions: 0
  };

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    const all = this.favoritesService.getFavorites();
    this.hotels             = all.filter(f => f.type === 'hotel');
    this.restaurants        = all.filter(f => f.type === 'restaurant');
    this.tourGuides         = all.filter(f => f.type === 'tourGuide');
    this.touristAttractions = all.filter(f => f.type === 'attraction');
  }

  deleteFav(item: FavoriteItem) {
    this.favoritesService.removeFavorite(item.title);
    this.loadFavorites();
    // لو الـ index بقى أكبر من عدد العناصر بعد الحذف، نرجعه
    const keys = ['hotels', 'restaurants', 'tourGuides', 'touristAttractions'];
    keys.forEach(k => {
      const arr = (this as any)[k] as FavoriteItem[];
      if (this.sliderIndex[k] >= arr.length && arr.length > 0) {
        this.sliderIndex[k] = arr.length - 1;
      }
    });
  }

  // ── Slider helpers ───────────────────────────────────
  currentItem(section: string): FavoriteItem | null {
    const arr = (this as any)[section] as FavoriteItem[];
    return arr[this.sliderIndex[section]] ?? null;
  }

  next(section: string) {
    const arr = (this as any)[section] as FavoriteItem[];
    if (this.sliderIndex[section] < arr.length - 1) {
      this.sliderIndex[section]++;
    }
  }

  prev(section: string) {
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