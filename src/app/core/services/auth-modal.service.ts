import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  activeModal = signal<'login' | 'signup' | 'forgot-password' | 'enter-code' | 'reset-password' | null>(null);

  openLogin()          { this.activeModal.set('login'); }
  openSignup()         { this.activeModal.set('signup'); }
  openForgotPassword() { this.activeModal.set('forgot-password'); }
  openEnterCode()      { this.activeModal.set('enter-code'); }
  openResetPassword()  { this.activeModal.set('reset-password'); }
  close()              { this.activeModal.set(null); }
}