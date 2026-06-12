import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
    return this.http.post<AuthResponse>(`${BASE_URL}/Auth`, { email, password }).pipe(
      map(res => {
        this._saveTokens(res);
        const user: User = {
          firstName:    res.firstName,
          lastName:     res.lastName,
          email:        res.email,
          phone:        '',
          profileImage: '',
          roles:        res.roles ?? [],
        };
        localStorage.setItem('voyago_current_user', JSON.stringify(user));
        this.currentUser.set(user);
        return { success: true, message: 'Welcome back!' };
      }),
      catchError(err => throwError(() => err))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    if (!token || !refreshToken) {
      return throwError(() => new Error('No tokens available'));
    }

    return this.http.post<AuthResponse>(
      `${BASE_URL}/Auth/refresh`,
      { token, refreshToken }
    ).pipe(
      map(res => {
        this._saveTokens(res);
        return res;
      }),
      catchError(err => throwError(() => err))
    );
  }

  // ✅ للـ profile logout — بيستنى الـ revoke
  logout(): Observable<any> {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    if (token && refreshToken) {
      return this.http.post(
        `${BASE_URL}/Auth/revoke-refresh-token`,
        { token, refreshToken }
      ).pipe(
        catchError(() => of(null)),
        map(() => this._clearLocalStorage())
      );
    }

    this._clearLocalStorage();
    return of(null);
  }

  // ✅ للـ interceptor — بيمسح فوراً من غير ما يستنى
  forceLogout(): void {
    const token        = localStorage.getItem('voyago_token');
    const refreshToken = localStorage.getItem('voyago_refresh_token');

    if (token && refreshToken) {
      this.http.post(
        `${BASE_URL}/Auth/revoke-refresh-token`,
        { token, refreshToken }
      ).subscribe({ error: () => {} });
    }

    this._clearLocalStorage();
  }

  private _clearLocalStorage(): void {
    localStorage.removeItem('voyago_current_user');
    localStorage.removeItem('voyago_token');
    localStorage.removeItem('voyago_refresh_token');
    localStorage.removeItem('voyago_token_expires_at');
    this.currentUser.set(null);
  }

  private _saveTokens(res: AuthResponse): void {
    localStorage.setItem('voyago_token', res.token);
    localStorage.setItem('voyago_refresh_token', res.refreshToken);
    const expiresAt = Date.now() + (res.expiresIn * 1000);
    localStorage.setItem('voyago_token_expires_at', expiresAt.toString());
  }

  updateProfileImage(imageBase64: string): void {
    const user = this.currentUser();
    if (!user) return;
    const updated = { ...user, profileImage: imageBase64 };
    localStorage.setItem('voyago_current_user', JSON.stringify(updated));
    this.currentUser.set(updated);
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
      `${BASE_URL}/Auth/verify-otp`,
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
    const data = localStorage.getItem('voyago_current_user');
    return data ? JSON.parse(data) : null;
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
}