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
  languagesRaw?: string;
  tours?: number;
  status?: string;
  liked?: boolean;
  totalTourGuides?: number;
  activeTourGuides?: number;
  inactiveTourGuides?: number;
}

const BASE_URL = 'http://voyagoo.runasp.net';

@Injectable({ providedIn: 'root' })
export class TourGuideService {

  private _guides: TourGuide[] = [];
  private _cache: TourGuide[] | null = null;

  adminStats = { total: 0, active: 0, inactive: 0 };

  constructor(private http: HttpClient) {}

  getAll(): Observable<TourGuide[]> {
    if (this._cache) return of(this._cache);
    return this.http.get<TourGuide[]>(`${BASE_URL}/TourGuides`).pipe(
      map(data => data.map(g => ({ ...g, image: g.profilePictureUrl }))),
      tap(data => { this._guides = data; this._cache = data; }),
      catchError(err => throwError(() => err))
    );
  }

  getById_API(id: number): Observable<TourGuide> {
    return this.http.get<TourGuide>(`${BASE_URL}/TourGuides/${id}`).pipe(
      map(g => ({ ...g, image: g.profilePictureUrl })),
      catchError(err => throwError(() => err))
    );
  }

  adminGetAll(): Observable<TourGuide[]> {
    return this.http.get<any>(`${BASE_URL}/admin/tour-guides/GetAllTourGuides`).pipe(
      map(res => {
        this.adminStats = {
          total:    res?.totalTourGuides    ?? 0,
          active:   res?.activeTourGuides   ?? 0,
          inactive: res?.inactiveTourGuides ?? 0,
        };

        const raw: any[] = res?.tourGuides ?? res ?? [];
        this._guides = raw.map(g => ({
          ...g,
          image:        g.profilePictureUrl ?? g.image ?? '',
          languagesRaw: typeof g.languages === 'string' ? g.languages : '',
          languages: typeof g.languages === 'string'
            ? g.languages
                .split(',')
                .map((l: string) => l.trim())
                .filter((l: string) => l && !l.startsWith('+'))
            : (Array.isArray(g.languages) ? g.languages : []),
        }));
        return this._guides;
      }),
      catchError(err => throwError(() => err))
    );
  }

  adminAdd(payload: {
    name: string; email: string; phoneNumber: string;
    description: string; rating: number; pricePerDay: number; languages: number[];
  }): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/admin/tour-guides`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  adminUpdate(id: number, payload: {
    name: string; email: string; phoneNumber: string;
    description: string; rating: number; pricePerDay: number; languages: number[];
  }): Observable<any> {
    return this.http.put<any>(`${BASE_URL}/admin/tour-guides/${id}`, payload).pipe(
      catchError(err => throwError(() => err))
    );
  }

  adminDelete(id: number): Observable<any> {
    this._cache = null;
    return this.http.delete(`${BASE_URL}/admin/tour-guides/${id}`, { responseType: 'text' }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  adminUploadImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<any>(`${BASE_URL}/admin/tour-guides/${id}/image`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  adminUpdateStatus(id: number, statusId: number): Observable<any> {
    return this.http.patch<any>(
      `${BASE_URL}/admin/tour-guides/${id}/status`,
      statusId,
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(catchError(err => throwError(() => err)));
  }

  adminGetLanguages(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(
      `${BASE_URL}/admin/tour-guides/languages`
    ).pipe(catchError(err => throwError(() => err)));
  }

  adminGetStatuses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(
      `${BASE_URL}/admin/tour-guides/statuses`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── FAVORITES API ────────────────────────────────────────
  toggleFavoriteApi(guideId: number): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}/Favorites/tour-guides/${guideId}/toggle`,
      {}
    ).pipe(catchError(err => throwError(() => err)));
  }

  getCached(): TourGuide[]                   { return this._guides; }
  getById(id: number): TourGuide | undefined { return this._guides.find(g => g.id === id); }

  bookGuide(guideId: number, bookingDate: string, numberOfDays: number): Observable<any> {
    return this.http.post(
      `${BASE_URL}/tour-guides/${guideId}/bookings`,
      { bookingDate, numberOfDays }
    ).pipe(catchError(err => throwError(() => err)));
  }
}