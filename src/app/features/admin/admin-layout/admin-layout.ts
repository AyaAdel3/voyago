import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DarkModeService } from '../../../core/services/dark-mode.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  private router = inject(Router);
  public darkMode = inject(DarkModeService);
  private auth = inject(AuthService);

  currentTitle = 'Dashboard';
  currentSubtitle = "Welcome back! Here's an overview of your tourism management system";

  navItems = [
    { label: 'Dashboard',   icon: 'dashboard',   path: '/admin/dashboard' },
    { label: 'Hotels',      icon: 'hotel',       path: '/admin/hotels' },
    { label: 'Restaurants', icon: 'restaurant',  path: '/admin/restaurants' },
    { label: 'Attractions', icon: 'attractions', path: '/admin/attractions' },
    { label: 'Tour Guide',  icon: 'tour',        path: '/admin/tour-guides' },
    { label: 'Users',       icon: 'users',       path: '/admin/users' },
  ];

  titleMap: Record<string, { title: string; subtitle: string }> = {
    '/admin/dashboard':          { title: 'Dashboard',          subtitle: "Welcome back! Here's an overview of your tourism management system" },
    '/admin/hotels':             { title: 'Hotels',             subtitle: 'Manage hotel listings and information' },
    '/admin/hotels/manage':      { title: 'Manage Hotels',      subtitle: 'Add or edit hotel information' },
    '/admin/restaurants':        { title: 'Restaurants',        subtitle: 'Manage restaurant listings and details' },
    '/admin/restaurants/manage': { title: 'Manage Restaurant',  subtitle: 'Add or edit restaurant information' },
    '/admin/attractions':        { title: 'Attractions',        subtitle: 'Manage tourist attractions and landmarks' },
    '/admin/attractions/manage': { title: 'Manage Attractions', subtitle: 'Add or edit attraction information' },
    '/admin/tour-guides':        { title: 'Tour Guides',        subtitle: 'Manage hotel listings and information' },
    '/admin/tour-guides/manage': { title: 'Manage Tour Guide',  subtitle: 'Add or edit tour guide information' },
    '/admin/users':              { title: 'Users',              subtitle: 'Manage system users and access permissions' },
  };

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects.split('?')[0];
      const match = Object.keys(this.titleMap).find(k => url.startsWith(k) && (this.titleMap[url] || k === url));
      const info = this.titleMap[url] || (match ? this.titleMap[match] : null);
      if (info) {
        this.currentTitle = info.title;
        this.currentSubtitle = info.subtitle;
      }
    });
  }

  get isDarkMode() { return this.darkMode.isDarkMode(); }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  // ✅ الصح
logout(): void {
  this.auth.logout().subscribe({
    complete: () => this.router.navigate(['/home'])
  });
}
}