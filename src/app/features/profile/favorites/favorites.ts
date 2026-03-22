import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; // ضروري جداً لعمل اللينكات
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule], // لازم يكونوا موجودين هنا
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent implements OnInit {
  myFavorites: any[] = [];

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    // بيسحب الداتا اللي إنت عملت لها "قلب" من الهوتيلز والمطاعم
    this.myFavorites = this.favoritesService.getFavorites();
  }

  deleteFav(index: number) {
    // بيمسح العنصر من المفضلة
    this.favoritesService.removeFavorite(index);
    this.loadFavorites(); // بيحدث الشكل فوراً
  }
}