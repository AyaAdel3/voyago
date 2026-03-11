import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthModalService } from '../../../core/services/auth-modal.service';
import { Register } from '../../../core/Auth/register/register';
import { Login } from '../../../core/Auth/login/login';
import { ForgotPassword } from '../../../core/Auth/forgot-password/forgot-password';
import { EnterCode } from '../../../core/Auth/enter-code/enter-code';
import { ResetPassword } from '../../../core/Auth/reset-password/reset-password';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, Register, Login, ForgotPassword, EnterCode, ResetPassword],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  isDarkMode = false;

  constructor(public modal: AuthModalService, public router: Router) {}

  ngOnInit(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      this.isDarkMode = true;
      this.applyDarkMode();
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  applyDarkMode(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  isHotelsActive(): boolean {
    return this.router.url.startsWith('/hotels');
  }

  isRestaurantsActive(): boolean {
    return this.router.url.startsWith('/Restaurants') || this.router.url.startsWith('/restaurant');
  }

  isAttractionsActive(): boolean {
    return this.router.url.startsWith('/Attractions') || this.router.url.startsWith('/tourist-attraction');
  }

  isTourGuideActive(): boolean {
    return this.router.url.startsWith('/tour-guide');
  }

 isBudgetActive(): boolean {
  const url = decodeURIComponent(this.router.url);
  return url.startsWith('/Budget Planning') || url.startsWith('/budget-planning');
}
}