// ============================================================
// navbar.ts  →  src/app/core/layouts/navbar/
// ============================================================

import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthModalService } from '../../../core/services/auth-modal.service';
import { Register } from '../../../core/Auth/register/register';
import { Login } from '../../../core/Auth/login/login';
import { ForgotPassword } from '../../../core/Auth/forgot-password/forgot-password';
import { EnterCode } from '../../../core/Auth/enter-code/enter-code';
import { ResetPassword } from '../../../core/Auth/reset-password/reset-password';
import { LanguageService } from '../../../core/services/language.service';
import { SearchService, SearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, CommonModule, FormsModule,
    Register, Login, ForgotPassword, EnterCode, ResetPassword,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  isDarkMode = false;

  // ── Search ────────────────────────────────────────────────
  searchQuery = '';

  constructor(
    public modal:  AuthModalService,
    public router: Router,
    public lang:   LanguageService,
    public search: SearchService,
    private elRef: ElementRef,
  ) {}

  ngOnInit(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      this.isDarkMode = true;
      this.applyDarkMode();
    }
  }

  // ── Dark mode ─────────────────────────────────────────────
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  applyDarkMode(): void {
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  // ── Search input handler ──────────────────────────────────
  onSearchInput(): void {
    this.search.setQuery(this.searchQuery);
  }

  // ── Navigate to result and close dropdown ─────────────────
  goToResult(result: SearchResult): void {
    this.search.clear();
    this.searchQuery = '';
    this.router.navigate([result.route]);
  }

  // ── Close dropdown لو ضغط برا ────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.search.close();
    }
  }

  // ── Active links ──────────────────────────────────────────
  isHotelsActive(): boolean      { return this.router.url.startsWith('/hotels'); }
  isRestaurantsActive(): boolean { return this.router.url.startsWith('/Restaurants') || this.router.url.startsWith('/restaurant'); }
  isAttractionsActive(): boolean { return this.router.url.startsWith('/Attractions') || this.router.url.startsWith('/tourist-attraction'); }
  isTourGuideActive(): boolean   { return this.router.url.startsWith('/tour-guide'); }
  isBudgetActive(): boolean {
    const url = decodeURIComponent(this.router.url);
    return url.startsWith('/Budget Planning') || url.startsWith('/budget-planning');
  }
}