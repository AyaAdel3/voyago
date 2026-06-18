import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap, filter, take } from 'rxjs';
import { RefreshStateService } from '../services/refresh-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService    = inject(AuthService);
  const router         = inject(Router);
  const refreshState   = inject(RefreshStateService);

  // skip الـ auth endpoints عشان متعملش loop
  if (
    req.url.toLowerCase().includes('/auth/refresh') ||
    req.url.toLowerCase().includes('/auth/revoke-refresh-token')
  ) {
    return next(req);
  }

  const token   = localStorage.getItem('voyago_token');
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
      if (refreshState.isRefreshing) {
        return refreshState.tokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(addToken(req, t!)))
        );
      }

      // ابدأ refresh جديد
      refreshState.isRefreshing = true;
      refreshState.tokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap(res => {
          refreshState.isRefreshing = false;
          refreshState.tokenSubject.next(res.token);
          return next(addToken(req, res.token));
        }),
        catchError(refreshError => {
          refreshState.isRefreshing = false;
          refreshState.tokenSubject.next(null);
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