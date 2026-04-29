import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService, FavoriteItem } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent implements OnInit {
  hotels: FavoriteItem[] = [];
  restaurants: FavoriteItem[] = [];
  tourGuides: FavoriteItem[] = [];
  touristAttractions: FavoriteItem[] = [];

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    const all = this.favoritesService.getFavorites();
    this.hotels             = all.filter(f => f.type === 'hotel');
    this.restaurants        = all.filter(f => f.type === 'restaurant');
    this.tourGuides         = all.filter(f => f.type === 'tourGuide');
    this.touristAttractions = all.filter(f => f.type === 'attraction');
  }

  deleteFav(item: FavoriteItem) {
    this.favoritesService.removeFavorite(item.title);
    this.loadFavorites();
  }
}