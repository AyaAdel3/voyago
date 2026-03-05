import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  activeModal = signal<'login' | 'signup' | null>(null);

  openLogin()  { this.activeModal.set('login'); }
  openSignup() { this.activeModal.set('signup'); }
  close()      { this.activeModal.set(null); }
}