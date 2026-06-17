import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';

export interface User {
  firstName:    string;
  lastName:     string;
  email:        string;
  phone:        string;
  profileImage?: string;
  roles:        string[];
}

export interface RegisterPayload {
  firstName:   string;
  lastName:    string;
  email:       string;
  PhoneNumber: string;
  password:    string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface AuthResponse {
  id:                     string;
  email:                  string;
  firstName:              string;
  lastName:               string;
  token:                  string;
  expiresIn:              number;
  refreshToken:           string;
  refreshTokenExpiration: string;
  roles:                  string[];
}

const BASE_URL = 'http://voyagoo.runasp.net';

@Injectable({ providedIn: 'root' })
export class AuthService {

  currentUser  = signal<User | null>(this.getLoggedInUser());
  pendingEmail = '';

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE_URL}/auth/register`, payload).pipe(
      map(res => {
        const expiresAt = Date.now() + (res.expiresIn * 1000);
        localStorage.setItem('voyago_token_expires_at', expiresAt.toString());
        return res;
      }),
      catchError(err => throwError(() => err))
    );
  }

  login(email: string, password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<AuthResponse>(`${BASE_URL}/auth`, { email, password }).pipe(
      tap(res => this._saveTokens(res)),
      switchMap(res =>
        this.http.get<any>(`${BASE_URL}/Account/profile`).pipe(
          map(profile => {
            const user: User = {
              firstName:    res.firstName,
              lastName:     res.lastName,
              email:        res.email,
              phone:        profile.phoneNumber || '',
              profileImage: profile.profilePictureUrl || '',
              roles:        res.roles ?? [],
            };
            localStorage.setItem('voyago_current_user', JSON.stringify(user));
            this.currentUser.set({ ...user });
            return { success: true, message: 'Welcome back!' };
          })
        )
      ),
      catchError(err => throwError(() => err))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    if (!token || !refreshToken) {
      return throwError(() => new Error('No tokens available'));
    }

    const refreshExpStr = localStorage.getItem('voyago_refresh_token_expiration');
    if (refreshExpStr) {
      const refreshExp = new Date(refreshExpStr).getTime();
      if (Date.now() >= refreshExp) {
        this._clearLocalStorage();
        return throwError(() => new Error('Refresh token expired'));
      }
    }

    return this.http.post<AuthResponse>(
      `${BASE_URL}/auth/refresh`,
      { token, refreshToken }
    ).pipe(
      map(res => { this._saveTokens(res); return res; }),
      catchError(err => {
        // الـ backend رفض التوكنات (400/401) — مفيش فايدة من إعادة المحاولة
        // ننظف على طول عشان منعملش loop من 401 → refresh فاشل → 401 تاني
        this._clearLocalStorage();
        return throwError(() => err);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${BASE_URL}/Account/profile`).pipe(
      map(res => {
        const current = this.currentUser();
        return {
          firstName:    res.firstName,
          lastName:     res.lastName,
          email:        res.email,
          phone:        res.phoneNumber,
          profileImage: res.profilePictureUrl || current?.profileImage || '',
          roles:        current?.roles ?? [],
        };
      }),
      tap(user => {
        localStorage.setItem('voyago_current_user', JSON.stringify(user));
        this.currentUser.set({ ...user });
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateProfile(data: { firstName: string; lastName: string; PhoneNumber: string }): Observable<void> {
    return this.http.put<void>(
      `${BASE_URL}/Account/profile-update`,
      data
    ).pipe(catchError(err => throwError(() => err)));
  }

  updateLocalUser(data: { firstName: string; lastName: string; phone: string }): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...data };
    localStorage.setItem('voyago_current_user', JSON.stringify(updated));
    this.currentUser.set({ ...updated });
  }

  uploadProfilePicture(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put<void>(
      `${BASE_URL}/Account/profile-picture-update`,
      formData
    ).pipe(catchError(err => throwError(() => err)));
  }

  logout(): Observable<any> {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    if (token && refreshToken) {
      return this.http.post(
        `${BASE_URL}/auth/revoke-refresh-token`,
        { token, refreshToken },
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
      ).pipe(
        catchError(() => of(null)),
        map(() => this._clearLocalStorage())
      );
    }

    this._clearLocalStorage();
    return of(null);
  }

  forceLogout(): void {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    // ننظف فورًا — مفيش داعي ننتظر رد السيرفر عشان نمسح الجلسة محليًا
    this._clearLocalStorage();

    if (token && refreshToken) {
      this.http.post(
        `${BASE_URL}/auth/revoke-refresh-token`,
        { token, refreshToken },
        { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
      ).subscribe({ error: () => {} }); // best-effort فقط، التوكنات ممكن تكون بايظة فعلاً
    }
  }

  private _clearLocalStorage(): void {
    localStorage.removeItem('voyago_current_user');
    localStorage.removeItem('voyago_token');
    localStorage.removeItem('voyago_refresh_token');
    localStorage.removeItem('voyago_refresh_token_expiration');
    localStorage.removeItem('voyago_favorites');
    this.currentUser.set(null);
  }

  private _saveTokens(res: AuthResponse): void {
    localStorage.setItem('voyago_token', res.token);
    localStorage.setItem('voyago_refresh_token', res.refreshToken);
    if (res.refreshTokenExpiration) {
      localStorage.setItem('voyago_refresh_token_expiration', res.refreshTokenExpiration);
    }
  }

  updateProfileImage(imageUrl: string): void {
    const user = this.currentUser();
    if (!user) return;
    const updated = { ...user, profileImage: imageUrl };
    localStorage.setItem('voyago_current_user', JSON.stringify(updated));
    this.currentUser.set({ ...updated });
  }

  forgotPassword(email: string): Observable<any> {
    this.pendingEmail = email;
    return this.http.post(
      `${BASE_URL}/auth/forget-password`,
      { email },
      { responseType: 'text' }
    ).pipe(catchError(err => throwError(() => err)));
  }

  verifyOtp(code: string): Observable<any> {
    return this.http.post(
      `${BASE_URL}/auth/verify-otp`,
      { email: this.pendingEmail, code },
      { responseType: 'text' }
    ).pipe(catchError(err => throwError(() => err)));
  }

  resetPassword(newPassword: string, confirmNewPassword: string): Observable<any> {
    return this.http.post(
      `${BASE_URL}/auth/reset-password`,
      { email: this.pendingEmail, newPassword, confirmNewPassword },
      { responseType: 'text' }
    ).pipe(catchError(err => throwError(() => err)));
  }

  private getLoggedInUser(): User | null {
    try {
      const data = localStorage.getItem('voyago_current_user');
      if (!data) return null;
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean { return this.currentUser() !== null; }

  isAdmin(): boolean {
    return this.currentUser()?.roles?.some((r: string) => r.toLowerCase() === 'admin') ?? false;
  }

  isUser(): boolean {
    const roles = this.currentUser()?.roles ?? [];
    return roles.some((r: string) => r.toLowerCase() === 'user') || (!this.isAdmin() && this.isLoggedIn());
  }

  getFullName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${BASE_URL}/admin/dashboard`);
  }
}