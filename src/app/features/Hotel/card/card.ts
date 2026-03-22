import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Hotel } from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';
import { FavoritesService } from '../../../core/services/favorites.service';


@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card implements OnInit {
  hotels: Hotel[] = [];
  loading = true;

  constructor(
    public hotelService: HotelService,
    private favoritesService: FavoritesService, // إضافة السيرفس هنا
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe({
      next: (data) => {
        this.hotels = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // فنكشن التأكد إذا كان الفندق في المفضلة (عشان لون القلب)
  isHotelInFav(hotelName: string): boolean {
    const favs = this.favoritesService.getFavorites();
    return favs.some(f => f.title === hotelName);
  }

  goToDetails(id: number): void {
    this.router.navigate(['/hotels/details', id]);
  }

  // تعديل فنكشن الـ Toggle لتتعامل مع السيرفس العامة
  toggleFav(event: MouseEvent, hotel: any): void {
    event.stopPropagation();
    
    if (this.isHotelInFav(hotel.name)) {
      // لو موجود، نمسحه (بنبحث بالعنوان)
      const favs = this.favoritesService.getFavorites();
      const index = favs.findIndex(f => f.title === hotel.name);
      if (index !== -1) {
        this.favoritesService.removeFavorite(index);
      }
    } else {
      // لو مش موجود، نضيفه بكل بياناته عشان تظهر في صفحة الفيفورت
      this.favoritesService.addToFavorites({
        title: hotel.name,
        image: hotel.images[0], // بناخد أول صورة
        price: hotel.pricePerNight + 'le for 1 night',
        rating: hotel.rating
      });
    }
  }
}