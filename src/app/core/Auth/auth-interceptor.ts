import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // ✅ FIX: استثني الـ refresh endpoint عشان متدخلش في loop
  if (req.url.includes('/Auth/refresh-token')) {
    return next(req);
  }

  const token = localStorage.getItem('voyago_token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const newAuthReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.token}` }
            });
            return next(newAuthReq);
          }),
          catchError((refreshErr) => {
            authService.logout();
            // ✅ FIX: navigate بدل reload
            router.navigate(['/home']);
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};