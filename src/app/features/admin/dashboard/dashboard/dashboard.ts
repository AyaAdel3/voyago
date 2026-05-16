import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelService } from '../../../../core/services/hotel.service';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';
import { AttractionService, Attraction } from '../../../../core/services/attraction.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['../../admin-shared.css', './dashboard.css'],
})
export class Dashboard implements OnInit {

  stats = [
    { label: 'Total Hotels',      value: 0, icon: 'hotel',      link: '/admin/hotels'      },
    { label: 'Total Restaurants', value: 0, icon: 'restaurant', link: '/admin/restaurants' },
    { label: 'Total Guides',      value: 0, icon: 'tour',       link: '/admin/tour-guides' },
    { label: 'Total Attractions', value: 0, icon: 'attraction', link: '/admin/attractions' },
    { label: 'Total Users',       value: 0, icon: 'users',      link: '/admin/users'       },
  ];

  recentHotels:      any[] = [];
  recentRestaurants: any[] = [];
  topGuides:         any[] = [];
  topAttractions:    any[] = [];
  recentUsers:       any[] = [];

  constructor(
    private hotelService:      HotelService,
    private restaurantService: RestaurantService,
    private tourGuideService:  TourGuideService,
    private attractionService: AttractionService,
  ) {}

  ngOnInit(): void {
    // Hotels
    this.hotelService.getHotels().subscribe(hotels => {
      this.stats[0].value = hotels.length;
      this.recentHotels   = hotels.slice(0, 3).map(h => ({
        name:     h.name,
        location: h.location,
        rating:   h.rating,
        status:   (h as any).status ?? 'Active',
      }));
    });

    // Restaurants
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      this.stats[1].value    = restaurants.length;
      this.recentRestaurants = restaurants.slice(0, 3).map(r => ({
        name:    r.name,
        cuisine: r.cuisine,
        rating:  r.rating,
        status:  (r as any).status ?? 'Active',
      }));
    });

    // Tour Guides
    // const guides         = this.tourGuideService.getAll();
    // this.stats[2].value  = guides.length;
    // this.topGuides       = guides.slice(0, 3).map((g: TourGuide) => ({
    //   name:   g.name,
    //   rating: g.rating,
    //   tours:  g.tours,
    //   status: g.status,
    // }));

    this.tourGuideService.adminGetAll().subscribe({
      next: (guides: TourGuide[]) => {
        this.stats[2].value = guides.length;
        this.topGuides      = guides.slice(0, 3).map(g => ({
          name:   g.name,
          rating: g.rating,
          tours:  g.tours  ?? 0,
          status: g.status ?? 'Active',
        }));
      },
      error: () => {}
    });
    
    // Attractions - دلوقتي Observable
    this.attractionService.getAll().subscribe((attractions: Attraction[]) => {
      this.stats[3].value = attractions.length;
      this.topAttractions = attractions.slice(0, 3).map((a: Attraction) => ({
        name:     a.name,
        category: a.category,   // دلوقتي string مباشرة من الـ API
        rating:   a.rating,
        image:    a.mainImageUrl,
      }));
    });

    // Users
    const users         = JSON.parse(localStorage.getItem('voyago_users') || '[]');
    this.stats[4].value = users.length;
    this.recentUsers    = users.length > 0
      ? users.slice(0, 3).map((u: any) => ({
          name:   u.name ?? u.username ?? 'User',
          email:  u.email ?? '—',
          status: 'Active',
        }))
      : [
          { name: 'Ahmed Mohamed', email: 'ahmed@gmail.com', status: 'Active' },
          { name: 'Sara Ali',      email: 'sara@gmail.com',  status: 'Active' },
          { name: 'Omar Hassan',   email: 'omar@gmail.com',  status: 'Active' },
        ];
  }

  viewOnSite(type: string) {
    const routes: Record<string, string> = {
      hotel:      '/hotels',
      restaurant: '/Restaurants',
    };
    window.open(routes[type] || '/', '_blank');
  }
}