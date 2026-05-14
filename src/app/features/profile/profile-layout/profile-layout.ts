import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DarkModeService } from '../../../core/services/dark-mode.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './profile-layout.html',
  styleUrl: './profile-layout.css',
})
export class ProfileLayout {
  private router = inject(Router);
  public darkMode = inject(DarkModeService);
  private auth = inject(AuthService);

  titleMap: Record<string, string> = {
    '/profile/personal-information': 'Personal Information',
    '/profile/favorites':            'Favorites',
    '/profile/saved-plan':           'Saved Plan',
  };

  currentTitle = 'Profile';

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.updateTitle(e.urlAfterRedirects);
      });
  }

  private updateTitle(url: string): void {
    const clean = url.split('?')[0];
    this.currentTitle = this.titleMap[clean] ?? 'Profile';
  }

  get isDarkMode(): boolean {
    return this.darkMode.isDarkMode();
  }

  get userName(): string {
    const user = this.auth.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  get userInitials(): string {
    const user = this.auth.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}