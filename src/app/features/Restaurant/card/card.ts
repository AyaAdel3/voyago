// ============================================================
// card.ts  →  src/app/features/Restaurant/card/
// قائمة الريستورانتات — نفس pattern بتاعة Hotel/card
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Restaurant } from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  restaurants: Restaurant[] = [];
  loading = true;

  constructor(
    public restaurantService: RestaurantService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe({
      next: data => {
        this.restaurants = data;
        this.loading     = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** الانتقال لصفحة تفاصيل الريستورانت */
  goToDetails(id: number): void {
    this.router.navigate(['/restaurant/details', id]);
  }

  /** toggle الـ favorite مع وقف الـ event عشان ميفتحش الصفحة */
  toggleFav(event: MouseEvent, id: number): void {
    event.stopPropagation();
    this.restaurantService.toggleFavorite(id);
  }
}