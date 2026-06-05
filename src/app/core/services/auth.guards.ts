import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthModalService } from './auth-modal.service';

// 🔒 Root Guard
export const rootGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};

// 🔒 Admin Guard
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    inject(AuthModalService).openLogin();
    router.navigate(['/home']);
    return false;
  }

  if (auth.isAdmin()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};

// 🔒 User Guard
// لو الأدمن حاول يدخل على route يوزر → logout وسيبه يكمل كـ guest
export const userGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    auth.logout();
    return true;
  }

  if (!auth.isLoggedIn()) {
    inject(AuthModalService).openLogin();
    router.navigate(['/home']);
    return false;
  }

  return true;
};

// 🔒 Auth Guard
// نفس المنطق — لو الأدمن دخل على profile مثلاً → logout وسيبه
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    auth.logout();
    return true;
  }

  if (!auth.isLoggedIn()) {
    inject(AuthModalService).openLogin();
    router.navigate(['/home']);
    return false;
  }

  return true;
};