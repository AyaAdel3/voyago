import { Injectable, signal } from '@angular/core';

export interface User {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  currentUser = signal<User | null>(this.getLoggedInUser());

  // ===== REGISTER =====
  register(user: User): { success: boolean; message: string } {
    const users = this.getAllUsers();

    // تأكد مفيش أكونت بنفس الإيميل أو التليفون
    const exists = users.find(
      u => u.email === user.email || u.phone === user.phone
    );

    if (exists) {
      if (exists.email === user.email) {
        return { success: false, message: 'This email is already registered.' };
      }
      return { success: false, message: 'This phone number is already registered.' };
    }

    users.push(user);
    localStorage.setItem('voyago_users', JSON.stringify(users));
    return { success: true, message: 'Account created successfully!' };
  }

  // ===== LOGIN =====
  login(identifier: string, password: string): { success: boolean; message: string } {
    const users = this.getAllUsers();

    const user = users.find(
      u =>
        (u.email === identifier || u.phone === identifier) &&
        u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email/phone or password.' };
    }

    // احفظ الـ logged in user
    localStorage.setItem('voyago_current_user', JSON.stringify(user));
    this.currentUser.set(user);
    return { success: true, message: 'Welcome back!' };
  }

  // ===== LOGOUT =====
  logout(): void {
    localStorage.removeItem('voyago_current_user');
    this.currentUser.set(null);
  }

  // ===== HELPERS =====
  private getAllUsers(): User[] {
    const data = localStorage.getItem('voyago_users');
    return data ? JSON.parse(data) : [];
  }

  private getLoggedInUser(): User | null {
    const data = localStorage.getItem('voyago_current_user');
    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}