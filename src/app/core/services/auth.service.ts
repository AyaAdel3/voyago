import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface User {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
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
    return this.http.post<AuthResponse>(`${BASE_URL}/auth/register`, payload);
  }

  login(email: string, password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<AuthResponse>(`${BASE_URL}/Auth`, { email, password }).pipe(
      map(res => {
        localStorage.setItem('voyago_token', res.token);
        localStorage.setItem('voyago_refresh_token', res.refreshToken);

        const user: User = {
          firstName: res.firstName,
          lastName:  res.lastName,
          email:     res.email,
          phone:     '',
        };
        localStorage.setItem('voyago_current_user', JSON.stringify(user));
        this.currentUser.set(user);

        return { success: true, message: 'Welcome back!' };
      }),
      catchError(err => throwError(() => err))
    );
  }

  forgotPassword(email: string): Observable<any> {
    this.pendingEmail = email;
    return this.http.post(
      `${BASE_URL}/auth/forget-password`,
      { email },
      { responseType: 'text' }
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }

  verifyOtp(code: string): Observable<any> {
    return this.http.post(
      `${BASE_URL}/Auth/verify-otp`,
      { email: this.pendingEmail, code },
      { responseType: 'text' }
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }

  resetPassword(newPassword: string, confirmNewPassword: string): Observable<any> {
    return this.http.post(
      `${BASE_URL}/auth/reset-password`,
      { email: this.pendingEmail, newPassword, confirmNewPassword },
      { responseType: 'text' }
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem('voyago_current_user');
    localStorage.removeItem('voyago_token');
    localStorage.removeItem('voyago_refresh_token');
    this.currentUser.set(null);
  }

  private getLoggedInUser(): User | null {
    const data = localStorage.getItem('voyago_current_user');
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean { return this.currentUser() !== null; }

  getFullName(): string {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }
}