import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private storageKey = 'voyago_favorites';

  constructor() {}

  // جلب كل العناصر المحفوظة
  getFavorites(): any[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // إضافة عنصر جديد
  addToFavorites(item: any) {
    const favorites = this.getFavorites();
    const exists = favorites.find(f => f.title === item.title);
    if (!exists) {
      favorites.push(item);
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }
  }

  // مسح عنصر
  removeFavorite(index: number) {
    const favorites = this.getFavorites();
    favorites.splice(index, 1);
    localStorage.setItem(this.storageKey, JSON.stringify(favorites));
  }
}