import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {

  isDarkMode = signal<boolean>(false);

  constructor() {

    const savedMode = localStorage.getItem('darkMode');
    const dark = savedMode === 'true';

    this.isDarkMode.set(dark);

    this.applyClass(dark);
  }

  toggle(): void {

    const newMode = !this.isDarkMode();

    this.isDarkMode.set(newMode);

    localStorage.setItem('darkMode', newMode.toString());

    this.applyClass(newMode);
  }

  private applyClass(isDark: boolean): void {

    document.body.classList.toggle('dark-mode', isDark);

  }
}