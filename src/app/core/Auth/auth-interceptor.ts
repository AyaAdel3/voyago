import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, filter, take } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

// ── Shared state — خارج الـ interceptor عشان يتشارك بين كل الـ requests ──
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // استثني الـ refresh endpoint عشان متدخلش في loop
  if (req.url.includes('/Auth/refresh-token')) {
    return next(req);
  }

  const token        = localStorage.getItem('voyago_token');
  const expiresAtStr = localStorage.getItem('voyago_token_expires_at');
  const isAboutToExpire =
    expiresAtStr && Date.now() > parseInt(expiresAtStr) - 60_000; // دقيقة قبل الانتهاء

  // ✅ لو التوكن هينتهي قريباً، عمل refresh استباقي بدل ما تنتظر الـ 401
  if (token && isAboutToExpire && !isRefreshing) {
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

  // ── بعت الـ request العادي ──
  return next(addToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // ✅ لو في refresh شغال دلوقتي، استنى التوكن الجديد بدل ما تعمل refresh تاني
      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(addToken(req, newToken)))
        );
      }

      // ✅ ابدأ refresh وblock الـ requests التانية
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

// ── Helper ──
function addToken(req: any, token: string | null) {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}