import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FavoriteItem {
  id?: number;
  title: string;
  image: string;
  price: string;
  rating: number;
  type: 'hotel' | 'restaurant' | 'tourGuide' | 'attraction';
}
import { environment } from '../../../environments/environment';

export interface FavoritesApiResponse {
  restaurants: {
    id: number;
    name: string;
    cuisineType: string;
    rating: number;
    mainImageUrl: string;
  }[];
  tourGuides: {
    id: number;
    name: string;
    rating: number;
    profilePictureUrl: string;
  }[];
  attractions: {
    id: number;
    name: string;
    location: string;
    rating: number;
    mainImageUrl: string;
  }[];
  hotels: {
    id: number;
    name: string;
    location: string;
    rating: number;
    mainImageUrl: string;
  }[];
}

const BASE_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class FavoritesService {

  private storageKey = 'voyago_favorites';

  constructor(private http: HttpClient) {}

  // ── API ─────────────────────────────────────────────
  getAllFavoritesFromApi(): Observable<FavoritesApiResponse> {
    return this.http.get<FavoritesApiResponse>(
      `${BASE_URL}/Favorites/GetAllFavorites`
    );
  }

  toggleFavoriteApi(type: string, id: number): Observable<void> {
    const typeMap: Record<string, string> = {
      restaurant: 'restaurants',
      tourGuide:  'tour-guides',
      attraction: 'attractions',
      hotel:      'hotels',
    };
    const segment = typeMap[type];
    return this.http.post<void>(
      `${BASE_URL}/Favorites/${segment}/${id}/toggle`,
      {}
    );
  }

  mapApiToFavoriteItems(res: FavoritesApiResponse): FavoriteItem[] {
    const items: FavoriteItem[] = [];

    res.hotels?.forEach(h => items.push({
      id:     h.id,
      title:  h.name,
      image:  h.mainImageUrl,
      price:  h.location,
      rating: h.rating,
      type:   'hotel'
    }));

    res.restaurants?.forEach(r => items.push({
      id:     r.id,
      title:  r.name,
      image:  r.mainImageUrl,
      price:  r.cuisineType,
      rating: r.rating,
      type:   'restaurant'
    }));

    res.tourGuides?.forEach(g => items.push({
      id:     g.id,
      title:  g.name,
      image:  g.profilePictureUrl,
      price:  '',
      rating: g.rating,
      type:   'tourGuide'
    }));

    res.attractions?.forEach(a => items.push({
      id:     a.id,
      title:  a.name,
      image:  a.mainImageUrl,
      price:  a.location,
      rating: a.rating,
      type:   'attraction'
    }));

    return items;
  }

  // ── Local Storage ────────────────────────────────────
  getFavorites(): FavoriteItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveFavorites(items: FavoriteItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  addToFavorites(item: FavoriteItem): void {
    const favorites = this.getFavorites();
    const exists = favorites.find(f => f.title === item.title);
    if (!exists) {
      favorites.push(item);
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }
  }

  removeFavorite(title: string): void {
    const favorites = this.getFavorites().filter(f => f.title !== title);
    localStorage.setItem(this.storageKey, JSON.stringify(favorites));
  }

  isFavorite(title: string): boolean {
    return this.getFavorites().some(f => f.title === title);
  }
}