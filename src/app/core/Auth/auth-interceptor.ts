import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  catchError,
  throwError,
  switchMap,
  filter,
  take,
  BehaviorSubject
} from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    req.url.toLowerCase().includes('/auth/refresh') ||
    req.url.toLowerCase().includes('/auth/revoke-refresh-token')
  ) {
    return next(req);
  }

  const token = localStorage.getItem('voyago_token');
  const expiresAtStr = localStorage.getItem('voyago_token_expires_at');
  const expiresAt = expiresAtStr ? Number(expiresAtStr) : null;

  const isAboutToExpire =
    !!token &&
    !!expiresAt &&
    Date.now() >= (expiresAt - 60000);

  // ============================
  // Token about to expire
  // ============================
  if (isAboutToExpire) {

    if (isRefreshing) {
      return refreshTokenSubject.pipe(
        filter(t => t !== null),
        take(1),
        switchMap(t => next(addToken(req, t)))
      );
    }

    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(res => {
        isRefreshing = false;
        refreshTokenSubject.next(res.token);
        return next(addToken(req, res.token));
      }),
      catchError(err => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.forceLogout();
        router.navigate(['/home']);
        return throwError(() => err);
      })
    );
  }

  // ============================
  // Normal Request
  // ============================
  return next(addToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(addToken(req, t)))
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap(res => {
          isRefreshing = false;
          refreshTokenSubject.next(res.token);
          return next(addToken(req, res.token));
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshTokenSubject.next(null);
          authService.forceLogout();
          router.navigate(['/home']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function addToken(req: any, token: string | null) {
  if (!token) {
    return req;
  }
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}