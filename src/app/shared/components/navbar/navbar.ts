import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
  Injector,
  effect
} from '@angular/core';

import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthModalService } from '../../../core/services/auth-modal.service';
import { AuthService } from '../../../core/services/auth.service';

import { Register } from '../../../core/Auth/register/register';
import { Login } from '../../../core/Auth/login/login';
import { ForgotPassword } from '../../../core/Auth/forgot-password/forgot-password';
import { EnterCode } from '../../../core/Auth/enter-code/enter-code';
import { ResetPassword } from '../../../core/Auth/reset-password/reset-password';

import { LanguageService } from '../../../core/services/language.service';
import { SearchService, SearchResult } from '../../../core/services/search.service';
import { DarkModeService } from '../../../core/services/dark-mode.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    FormsModule,
    Register,
    Login,
    ForgotPassword,
    EnterCode,
    ResetPassword,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {

  searchQuery    = '';
  mobileMenuOpen = false;
  isMobile       = window.innerWidth <= 768;
  profileImage   = '';

  constructor(
    public modal:     AuthModalService,
    public auth:      AuthService,
    public router:    Router,
    public lang:      LanguageService,
    public search:    SearchService,
    private elRef:    ElementRef,
    public darkMode:  DarkModeService,
    private cdr:      ChangeDetectorRef,
    private injector: Injector,
  ) {}

  ngOnInit(): void {
  // لو اليوزر logged in، جيب البيانات من الـ API
  if (this.auth.isLoggedIn()) {
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.profileImage = user.profileImage || '';
        this.cdr.detectChanges();
      },
      error: () => {
        // fallback على الـ localStorage
        this.profileImage = this.auth.currentUser()?.profileImage || '';
        this.cdr.detectChanges();
      }
    });
  } else {
    this.profileImage = this.auth.currentUser()?.profileImage || '';
  }

  effect(() => {
    const img = this.auth.currentUser()?.profileImage || '';
    if (this.profileImage !== img) {
      this.profileImage = img;
      this.cdr.detectChanges();
    }
  }, { injector: this.injector });
}

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleDarkMode(): void {
    this.darkMode.toggle();
  }

  onSearchInput(): void {
    this.search.setQuery(this.searchQuery);
  }

  goToResult(result: SearchResult): void {
    this.search.clear();
    this.searchQuery    = '';
    this.mobileMenuOpen = false;
    this.router.navigate([result.route]);
  }

  goToProfile(): void {
    this.mobileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.search.close();
      this.mobileMenuOpen = false;
    }
  }

  isHotelsActive(): boolean {
    return this.router.url.startsWith('/hotels');
  }

  isRestaurantsActive(): boolean {
    return (
      this.router.url.startsWith('/Restaurants') ||
      this.router.url.startsWith('/restaurant')
    );
  }

  isAttractionsActive(): boolean {
    return (
      this.router.url.startsWith('/Attractions') ||
      this.router.url.startsWith('/tourist-attraction')
    );
  }

  isTourGuideActive(): boolean {
    return this.router.url.startsWith('/tour-guide');
  }

  isBudgetActive(): boolean {
    const url = decodeURIComponent(this.router.url);
    return (
      url.startsWith('/Budget Planning') ||
      url.startsWith('/budget-planning')
    );
  }
}