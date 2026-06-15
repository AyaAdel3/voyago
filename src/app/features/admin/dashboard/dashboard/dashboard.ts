import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Details } from '../../../TourGuide/details/details';
import { TourGuide } from '../../../../core/services/tour-guide.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Details],
  templateUrl: './dashboard.html',
  styleUrls: ['../../admin-shared.css', './dashboard.css'],
})
export class Dashboard implements OnInit {

  stats = [
    { label: 'Total Hotels', value: 0, icon: 'hotel', link: '/admin/hotels' },
    { label: 'Total Restaurants', value: 0, icon: 'restaurant', link: '/admin/restaurants' },
    { label: 'Total Guides', value: 0, icon: 'tour', link: '/admin/tour-guides' },
    { label: 'Total Attractions', value: 0, icon: 'attraction', link: '/admin/attractions' },
    { label: 'Total Users', value: 0, icon: 'users', link: '/admin/users' },
  ];

  recentHotels: any[] = [];
  recentRestaurants: any[] = [];
  topGuides: any[] = [];
  topAttractions: any[] = [];
  recentUsers: any[] = [];

  selectedGuide: TourGuide | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.auth.getDashboardData().subscribe({
      next: (data) => {

        console.log('Dashboard Data:', data);

        this.stats = [
          {
            ...this.stats[0],
            value: data.overview?.totalHotels ?? 0,
          },
          {
            ...this.stats[1],
            value: data.overview?.totalRestaurants ?? 0,
          },
          {
            ...this.stats[2],
            value: data.overview?.totalTourGuides ?? 0,
          },
          {
            ...this.stats[3],
            value: data.overview?.totalAttractions ?? 0,
          },
          {
            ...this.stats[4],
            value: data.overview?.totalUsers ?? 0,
          },
        ];

        this.recentHotels = (data.topHotels ?? []).map((h: any) => ({
          id: h.id,
          name: h.name ?? h.hotelName ?? '',
          location: h.location ?? h.city ?? '—',
          rating: h.rating ?? 0,
          status: h.status ?? 'Active',
        }));

        this.recentRestaurants = (data.topRestaurants ?? []).map((r: any) => ({
          id: r.id,
          name: r.name ?? '',
          cuisine: r.cuisineType ?? r.cuisine ?? '—',
          rating: r.rating ?? 0,
          status: r.status ?? 'Active',
        }));

        this.topGuides = (data.topTourGuides ?? []).map((g: any) => ({
          id: g.id,
          name: g.name ?? '',
          rating: g.rating ?? 0,
          status: g.status ?? 'Active',
          email: g.email ?? '',
          phoneNumber: g.phoneNumber ?? '',
          languages: g.languages ?? [],
          profilePictureUrl: g.profilePictureUrl ?? '',
          bio: g.bio ?? '',
        }));

        this.topAttractions = (data.topAttractions ?? []).map((a: any) => ({
          id: a.id,
          name: a.name ?? '',
          category: a.category ?? '—',
          rating: a.rating ?? 0,
          status: a.status ?? 'Active',
        }));

        this.recentUsers = (data.recentUsers ?? []).map((u: any) => ({
          id: u.id,
          name: u.fullName ?? u.name ?? '',
          email: u.email ?? '',
          status: u.status ?? 'Active',
        }));

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Dashboard API error:', err);
      }
    });
  }

  viewItem(type: string, id: any, item?: any): void {
    if (type === 'tour-guide') {
      this.selectedGuide = item as TourGuide;
      return;
    }

    const routes: Record<string, string> = {
      hotel: '/hotels/details',
      restaurant: '/restaurant/details',
      attraction: '/tourist-attraction/details',
      user: '/admin/users',
    };

    const base = routes[type];
    if (!base) return;

    type === 'user'
      ? this.router.navigate([base])
      : window.open(`${base}/${id}`, '_blank');
  }

  closeDetails(): void {
    this.selectedGuide = null;
  }
}