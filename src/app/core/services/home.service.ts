import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HomeOffer {
  id: number;
  name: string;
  location: string;
  rating: number;
  minPrice: number;
  maxPrice: number;
  discount: number;
  mainImageUrl: string | null;
}

export interface HomePlace {
  id: number;
  name: string;
  location?: string;
  address?: string;
  rating: number;
  minPrice: number;
  maxPrice: number;
  mainImageUrl: string | null;
  cuisineType?: string;
  category?: string;
  type?: string;
}

export interface HomeResponse {
  offers: HomeOffer[];
  recommended: {
    hotels: HomePlace[];
    restaurants: HomePlace[];
    attractions: HomePlace[];
  };
  availableThisWeek: HomePlace[];
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(private http: HttpClient) {}

  getHomeData(): Observable<HomeResponse> {
    return this.http.get<HomeResponse>(`${environment.apiUrl}/Home`);
  }
}