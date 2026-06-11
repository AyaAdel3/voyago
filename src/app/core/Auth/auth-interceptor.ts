import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, filter, take } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // ✅ الـ endpoint الصح
  if (req.url.includes('/Auth/refresh')) {
    return next(req);
  }

  const token        = localStorage.getItem('voyago_token');
  const expiresAtStr = localStorage.getItem('voyago_token_expires_at');
  const expiresAt    = expiresAtStr ? parseInt(expiresAtStr) : null;
  const isAboutToExpire = token && expiresAt && Date.now() > expiresAt - 60_000;

  // ── Proactive refresh لو التوكن هينتهي قريباً ──
  if (isAboutToExpire && !isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res) => {
        isRefreshing = false;
        refreshTokenSubject.next(res.token);
        return next(addToken(req, res.token));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.logout();
        router.navigate(['/home']);
        return throwError(() => err);
      })
    );
  }

  // لو في refresh شغال دلوقتي، استنى
  if (isAboutToExpire && isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((t) => t !== null),
      take(1),
      switchMap((newToken) => next(addToken(req, newToken)))
    );
  }

  // ── الـ request العادي ──
  return next(addToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(addToken(req, newToken)))
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap((res) => {
          isRefreshing = false;
          refreshTokenSubject.next(res.token);
          return next(addToken(req, res.token));
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          refreshTokenSubject.next(null);
          authService.logout();
          router.navigate(['/home']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

function addToken(req: any, token: string | null) {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}