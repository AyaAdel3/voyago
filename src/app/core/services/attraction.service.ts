import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AttractionImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface Attraction {
  id: number;
  name: string;
  description: string;
  rating: number;
  category: string;
  mainImageUrl: string | null;
}

export interface AttractionDetails {
  id: number;
  name: string;
  description: string;
  location: string;
  yearOfInscription: number;
  ticketPrice: number;
  rating: number;
  category: string;
  images: AttractionImage[];
}

export interface AdminAttraction {
  id: number;
  name: string;
  location: string;
  rating: number;
  ticketPrice: number;
  category: string;
  status: string;
  mainImageUrl: string | null;
}

export interface AdminAttractionsResponse {
  totalAttractions: number;
  activeAttractions: number;
  inactiveAttractions: number;
  attractions: AdminAttraction[];
}

export interface AdminAttractionPayload {
  name: string;
  description: string;
  Location: string;
  yearOfInscription: number;
  ticketPrice: number;
  rating: number;
  category: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttractionService {

  private apiUrl   = '/api/Attractions';
  private adminUrl = '/api/admin/attractions';
private favUrl = `${environment.apiUrl}/Favorites/attractions`;

  private _cache: Attraction[] | null = null;

  constructor(private http: HttpClient) {}

  // ───────────────── Public ─────────────────

  getAll(): Observable<Attraction[]> {
    if (this._cache) {
      return of(this._cache);
    }
    return this.http.get<Attraction[]>(this.apiUrl).pipe(
      tap(data => this._cache = data)
    );
  }

  getById(id: number): Observable<AttractionDetails> {
    return this.http.get<AttractionDetails>(`${this.apiUrl}/${id}`);
  }

  // ── FAVORITES API ────────────────────────────────────────
  toggleFavoriteApi(attractionId: number): Observable<void> {
    return this.http.post<void>(
      `${this.favUrl}/${attractionId}/toggle`,
      {}
    );
  }

  // ───────────────── Admin ─────────────────

  adminGetCategories(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(
      `${this.adminUrl}/GetAllCategories`
    );
  }

  adminGetAll(): Observable<AdminAttractionsResponse> {
    return this.http.get<AdminAttractionsResponse>(
      `${this.adminUrl}/GetAllAttractions`
    );
  }

  adminAdd(payload: AdminAttractionPayload): Observable<any> {
    this._cache = null;
    return this.http.post(this.adminUrl, payload);
  }

  adminUpdate(id: number, payload: AdminAttractionPayload): Observable<any> {
    this._cache = null;
    return this.http.put(`${this.adminUrl}/${id}`, payload);
  }

  adminAddImages(id: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post(`${this.adminUrl}/${id}/images`, formData);
  }

  adminDelete(id: number): Observable<any> {
    this._cache = null;
    return this.http.delete(`${this.adminUrl}/${id}`);
  }

  adminDeleteImage(attractionId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${attractionId}/images/${imageId}`);
  }
}