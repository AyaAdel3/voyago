import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, filter, take, BehaviorSubject } from 'rxjs';

// ده module-level state — بيتشارك بين كل الـ requests
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // skip الـ auth endpoints عشان متعملش loop
  if (
    req.url.toLowerCase().includes('/auth/refresh') ||
    req.url.toLowerCase().includes('/auth/revoke-refresh-token')
  ) {
    return next(req);
  }

  const token = localStorage.getItem('voyago_token');
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('voyago_refresh_token');
      if (!refreshToken) {
        authService.forceLogout();
        router.navigate(['/home']);
        return throwError(() => error);
      }

      // لو في refresh جاري، استنى نتيجته
      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(addToken(req, t!)))
        );
      }

      // ابدأ refresh جديد
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
          refreshTokenSubject.next(null); // ← reset عشان الـ pending requests ما تتعلقش
          // ملحوظة: authService.refreshToken() دلوقتي بينظف الـ localStorage بنفسه عند الفشل،
          // فـ forceLogout هنا مش هيحاول يبعت revoke بتوكنات بايظة لأنها بقت ممسوحة فعلاً
          authService.forceLogout();
          router.navigate(['/home']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function addToken(req: any, token: string): any {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}