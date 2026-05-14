import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    // قرا الـ saved mode من الـ localStorage
    const saved = localStorage.getItem('darkMode');
    const dark = saved === 'true';
    this.isDarkMode.set(dark);
    this.applyClass(dark);
  }

  toggle(): void {
    const newVal = !this.isDarkMode();
    this.isDarkMode.set(newVal);
    localStorage.setItem('darkMode', newVal.toString());
    this.applyClass(newVal);
  }

  private applyClass(dark: boolean): void {
    document.body.classList.toggle('dark-mode', dark);
  }
}