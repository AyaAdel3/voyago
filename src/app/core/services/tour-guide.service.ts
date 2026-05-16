import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export type TourGuide = {
  id: number;
  name: string;
  image: string;
  profilePictureUrl: string;
  rating: number;
  pricePerDay: number;
  description: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  languages?: string[];
  tours?: number;
  status?: string;
  liked?: boolean;
}

const BASE_URL = 'http://voyagoo.runasp.net';

@Injectable({ providedIn: 'root' })
export class TourGuideService {

  private _guides: TourGuide[] = [];
  private _cache: TourGuide[] | null = null;

  constructor(private http: HttpClient) {}

  // ── Public: GET all ───────────────────────────────────────
  getAll(): Observable<TourGuide[]> {
    if (this._cache) return of(this._cache);
    return this.http.get<TourGuide[]>(`${BASE_URL}/TourGuides`).pipe(
      map(data => data.map(g => ({ ...g, image: g.profilePictureUrl }))),
      tap(data => {
        this._guides = data;
        this._cache = data;
      }),
      catchError(err => throwError(() => err))
    );
  }

  // ── Public: GET single ────────────────────────────────────
  getById_API(id: number): Observable<TourGuide> {
    return this.http.get<TourGuide>(`${BASE_URL}/TourGuides/${id}`).pipe(
      map(g => ({ ...g, image: g.profilePictureUrl })),
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: GET all ────────────────────────────────────────
  adminGetAll(): Observable<TourGuide[]> {
    return this.http.get<any>(`${BASE_URL}/admin/tour-guides/GetAllTourGuides`).pipe(
      map(res => {
        const data: TourGuide[] = res?.tourGuides ?? res;
        this._guides = data.map((g: TourGuide) => ({ ...g, image: g.profilePictureUrl }));
        return this._guides;
      }),
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: POST add ───────────────────────────────────────
  adminAdd(payload: {
    name: string;
    email: string;
    phoneNumber: string;
    description: string;
    rating: number;
    pricePerDay: number;
    languages: number[];
  }): Observable<any> {
    return this.http.post(`${BASE_URL}/admin/tour-guides`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: PUT update ─────────────────────────────────────
  adminUpdate(id: number, payload: {
    name: string;
    email: string;
    phoneNumber: string;
    description: string;
    rating: number;
    pricePerDay: number;
    languages: number[];
  }): Observable<any> {
    return this.http.put(`${BASE_URL}/admin/tour-guides/${id}`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: DELETE ─────────────────────────────────────────
  adminDelete(id: number): Observable<any> {
    this._cache = null;
    return this.http.delete(`${BASE_URL}/admin/tour-guides/${id}`, { responseType: 'text' }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: POST image upload ──────────────────────────────
  adminUploadImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${BASE_URL}/admin/tour-guides/${id}/image`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: PATCH status ───────────────────────────────────
  adminUpdateStatus(id: number, statusId: number): Observable<any> {
    return this.http.patch(`${BASE_URL}/admin/tour-guides/${id}/status`, statusId).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: GET languages ──────────────────────────────────
  adminGetLanguages(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${BASE_URL}/admin/tour-guides/languages`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Admin: GET statuses ───────────────────────────────────
  adminGetStatuses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${BASE_URL}/admin/tour-guides/statuses`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  // ── Local cache helpers ───────────────────────────────────
  getCached(): TourGuide[]                   { return this._guides; }
  getById(id: number): TourGuide | undefined { return this._guides.find(g => g.id === id); }

  // ── Public: book ──────────────────────────────────────────
  bookGuide(guideId: number, bookingDate: string, numberOfDays: number): Observable<any> {
    return this.http.post(
      `${BASE_URL}/tour-guides/${guideId}/bookings`,
      { bookingDate, numberOfDays }
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }
}