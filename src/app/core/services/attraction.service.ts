import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

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

@Injectable({ providedIn: 'root' })
export class AttractionService {
  private apiUrl = '/api/Attractions';
  private adminUrl = '/api/admin/attractions';

  private _cache: Attraction[] | null = null;
  private _detailsCache: Map<number, AttractionDetails> = new Map();
  private _adminCache: AdminAttractionsResponse | null = null;

  constructor(private http: HttpClient) {}

  // ── Public ──────────────────────────────────────────────
  getAll(): Observable<Attraction[]> {
    if (this._cache) return of(this._cache);
    return this.http.get<Attraction[]>(this.apiUrl).pipe(
      tap(data => this._cache = data)
    );
  }

  getById(id: number): Observable<AttractionDetails> {
    if (this._detailsCache.has(id)) return of(this._detailsCache.get(id)!);
    return this.http.get<AttractionDetails>(`${this.apiUrl}/${id}`).pipe(
      tap(data => this._detailsCache.set(id, data))
    );
  }

  // ── Admin ────────────────────────────────────────────────
  adminGetAll(): Observable<AdminAttractionsResponse> {
    if (this._adminCache) return of(this._adminCache);
    return this.http.get<AdminAttractionsResponse>(`${this.adminUrl}/GetAllAttractions`).pipe(
      tap(data => this._adminCache = data)
    );
  }

  adminDelete(id: number): Observable<any> {
    this._adminCache = null; // clear cache بعد الحذف
    return this.http.delete(`${this.adminUrl}/${id}`);
  }
}