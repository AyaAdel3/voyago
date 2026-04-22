import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelService } from '../../../../core/services/hotel.service';
import { RestaurantService } from '../../../../core/services/resturant.service';

// Mock data مباشرة عشان نجيب العدد
const TOUR_GUIDES_COUNT = 5;   // نفس عدد الـ guides في card.ts
const ATTRACTIONS_COUNT = 3;   // نفس عدد الـ attractions في card.ts

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['../../admin-shared.css', './dashboard.css'],
})
export class AdminDashboard implements OnInit {

  stats = [
    { label: 'Total Hotels', value: 0, icon: 'hotel', link: '/admin/hotels' },
    { label: 'Total Restaurants', value: 0, icon: 'restaurant', link: '/admin/restaurants' },
    { label: 'Total Guides', value: TOUR_GUIDES_COUNT, icon: 'tour', link: '/admin/tour-guides' },
    { label: 'Total Attractions', value: ATTRACTIONS_COUNT, icon: 'attraction', link: '/admin/attractions' },
    { label: 'Total Users', value: 0, icon: 'users', link: '/admin/users' },
  ];

  recentHotels: any[] = [];
  recentRestaurants: any[] = [];

  topGuides = [
    { name: 'Araya Smith', rating: 4.8, tours: 156, status: 'Active' },
    { name: 'Nattaya Wong', rating: 4.5, tours: 96, status: 'Active' },
    { name: 'Somchai Prasert', rating: 4.3, tours: 83, status: 'Active' },
  ];

  constructor(
    private hotelService: HotelService,
    private restaurantService: RestaurantService,
  ) {}

  ngOnInit(): void {
    // Hotels
    this.hotelService.getHotels().subscribe(hotels => {
      this.stats[0].value = hotels.length;
      this.recentHotels = hotels.slice(0, 3).map(h => ({
        name: h.name,
        location: h.location,
        rating: h.rating,
        status: 'Active',
      }));
    });

    // Restaurants
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      this.stats[1].value = restaurants.length;
      this.recentRestaurants = restaurants.slice(0, 3).map(r => ({
        name: r.name,
        cuisine: (r as any).cuisine ?? 'Various',
        rating: r.rating,
        status: 'Active',
      }));
    });

    // Users من الـ localStorage
    const users = JSON.parse(localStorage.getItem('voyago_users') || '[]');
    this.stats[4].value = users.length;
  }

  viewOnSite(type: string, name: string) {
    const routes: Record<string, string> = {
      hotel: '/hotels',
      restaurant: '/Restaurants',
    };
    window.open(routes[type] || '/', '_blank');
  }
}