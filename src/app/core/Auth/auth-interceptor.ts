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
  const router      = inject(Router);

  // ✅ Skip refresh/revoke endpoints عشان متعملش loop
  if (
    req.url.toLowerCase().includes('/auth/refresh') ||
    req.url.toLowerCase().includes('/auth/revoke-refresh-token')
  ) {
    return next(req);
  }

  const token        = localStorage.getItem('voyago_token');
  const refreshToken = localStorage.getItem('voyago_refresh_token');
  const expiresAtStr = localStorage.getItem('voyago_token_expires_at');
  const expiresAt    = expiresAtStr ? Number(expiresAtStr) : null;

  // ✅ لو مفيش token أو refresh token خالص، ابعت الـ request عادي بدون refresh
  if (!token || !refreshToken) {
    return next(req);
  }

  const isAboutToExpire =
    !!expiresAt &&
    Date.now() >= (expiresAt - 60_000);

  // ============================
  // Token about to expire → refresh proactively
  // ============================
  if (isAboutToExpire) {

    if (isRefreshing) {
      return refreshTokenSubject.pipe(
        filter(t  => t !== null),
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
        // ✅ clear localStorage قبل ما تعمل forceLogout
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

      // ✅ لو مش 401، ارجع الـ error عادي
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // ✅ لو مفيش refresh token، logout على طول
      const currentRefreshToken = localStorage.getItem('voyago_refresh_token');
      if (!currentRefreshToken) {
        authService.forceLogout();
        router.navigate(['/home']);
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter(t  => t !== null),
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
  if (!token) return req;
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}