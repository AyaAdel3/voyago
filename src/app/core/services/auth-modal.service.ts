import { Injectable, signal } from '@angular/core';

export type ModalView = 'login' | 'signup' | 'forgot-password' | 'enter-code' | 'reset-password' | null;

@Injectable({ providedIn: 'root' })
export class AuthModalService {

  private view = signal<ModalView>(null);

  // ── الاسمين الاتنين شغالين ──
  current     = this.view.asReadonly();
  activeModal = this.view.asReadonly();   // ← اللي الـ templates بتستخدمه

  open(v: ModalView)        { this.view.set(v); }
  close()                   { this.view.set(null); }
  openLogin()               { this.view.set('login'); }
  openRegister()            { this.view.set('signup'); }   // ← 'signup' عشان الـ templates
  openSignup()              { this.view.set('signup'); }   // ← alias
  openForgotPassword()      { this.view.set('forgot-password'); }
  openEnterCode()           { this.view.set('enter-code'); }
  openResetPassword()       { this.view.set('reset-password'); }

  isOpen()                  { return this.view() !== null; }
}