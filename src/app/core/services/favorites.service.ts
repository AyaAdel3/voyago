import { Injectable } from '@angular/core';

export interface FavoriteItem {
  title: string;
  image: string;
  price: string;
  rating: number;
  type: 'hotel' | 'restaurant' | 'tourGuide' | 'attraction';
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private storageKey = 'voyago_favorites';

  getFavorites(): FavoriteItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  addToFavorites(item: FavoriteItem) {
    const favorites = this.getFavorites();
    const exists = favorites.find(f => f.title === item.title);
    if (!exists) {
      favorites.push(item);
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }
  }

  removeFavorite(title: string) {
    const favorites = this.getFavorites().filter(f => f.title !== title);
    localStorage.setItem(this.storageKey, JSON.stringify(favorites));
  }

  isFavorite(title: string): boolean {
    return this.getFavorites().some(f => f.title === title);
  }
}