import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Restaurant } from '../../../core/model/restaurant.model';
import { RestaurantService } from '../../../core/services/resturant.service';
import { FavoritesService } from '../../../core/services/favorites.service';


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
    private favoritesService: FavoritesService, 
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

  /** فنكشن تلوين القلب بناءً على الاسم المتسيف في السيرفس **/
  isRestaurantInFav(name: string): boolean {
    const favs = this.favoritesService.getFavorites();
    return favs.some(f => f.title === name);
  }

  /** الانتقال لصفحة التفاصيل - تم تعديل المسار لـ restaurants (بالجمع) ليطابق الـ Routes **/
goToDetails(id: number): void {
  this.router.navigate(['restaurant/details', id]);
}

  /** الـ toggle عشان يضيف أو يمسح من المفضلة العامة **/
  toggleFav(event: MouseEvent, r: any): void {
    event.stopPropagation(); // منع فتح صفحة التفاصيل عند الضغط على القلب
    
    // سطر الـ toggle القديم بتاعك (اختياري لو السيرفس بتاعتك بتعمل حاجة تانية)
    this.restaurantService.toggleFavorite(r.id);

    if (this.isRestaurantInFav(r.name)) {
      // لو موجود نمسحه
      const favs = this.favoritesService.getFavorites();
      const index = favs.findIndex(f => f.title === r.name);
      if (index !== -1) {
        this.favoritesService.removeFavorite(index);
      }
    } else {
      // لو مش موجود نضيفه بالبيانات الموحدة (Title, Image, Price, Rating)
      this.favoritesService.addToFavorites({
        title: r.name,
        image: r.images[0],
        price: r.cuisine + ' • ' + r.priceRange,
        rating: r.rating
      });
    }
  }
}