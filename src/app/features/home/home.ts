import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chatbot } from '../../shared/components/chatbot/chatbot';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Chatbot],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {

  currentOfferIndex = 0;
  recommendedIndex = 0;
  availableIndex = 0;
  private autoSlideInterval: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private favoritesService: FavoritesService
  ) {}

  offers = [
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel1/800/400' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel2/800/400' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel3/800/400' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel4/800/400' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel5/800/400' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/seed/hotel6/800/400' },
  ];

  recommended = [
    { id: 1, name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=3', liked: false },
    { id: 2, name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=4', liked: false },
    { id: 3, name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=5', liked: false },
    { id: 4, name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=6', liked: false },
    { id: 5, name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=11', liked: false },
    { id: 6, name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=12', liked: false },
  ];

  availableThisWeek = [
    { id: 7,  name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=7', liked: false },
    { id: 8,  name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=8', liked: false },
    { id: 9,  name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=9', liked: false },
    { id: 10, name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=10', liked: false },
    { id: 11, name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=13', liked: false },
    { id: 12, name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=14', liked: false },
  ];

  get visibleOffers() {
    const len = this.offers.length;
    return [
      this.offers[this.currentOfferIndex % len],
      this.offers[(this.currentOfferIndex + 1) % len],
    ];
  }

  get visibleRecommended() {
    return this.recommended.slice(this.recommendedIndex, this.recommendedIndex + 4);
  }

  get visibleAvailable() {
    return this.availableThisWeek.slice(this.availableIndex, this.availableIndex + 4);
  }

  ngOnInit() {
    this.autoSlideInterval = setInterval(() => {
      this.currentOfferIndex = (this.currentOfferIndex + 2) % this.offers.length;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 3000);

    this.syncFavorites();
  }

  ngOnDestroy() {
    clearInterval(this.autoSlideInterval);
  }

  nextOffer() {
    this.currentOfferIndex = (this.currentOfferIndex + 2) % this.offers.length;
    this.cdr.detectChanges();
  }
  prevOffer() {
    this.currentOfferIndex = (this.currentOfferIndex - 2 + this.offers.length) % this.offers.length;
    this.cdr.detectChanges();
  }

  nextRecommended() {
    if (this.recommendedIndex + 4 < this.recommended.length) this.recommendedIndex++;
  }
  prevRecommended() {
    if (this.recommendedIndex > 0) this.recommendedIndex--;
  }

  nextAvailable() {
    if (this.availableIndex + 4 < this.availableThisWeek.length) this.availableIndex++;
  }
  prevAvailable() {
    if (this.availableIndex > 0) this.availableIndex--;
  }

  toggleLike(item: any) {
    item.liked = !item.liked;
    if (item.liked) {
      this.favoritesService.addToFavorites({
        title: item.name,
        image: item.image,
        price: item.price,
        rating: item.rating,
        type: 'hotel'
      });
    } else {
      this.favoritesService.removeFavorite(item.name);
    }
  }

  syncFavorites() {
    const favorites = this.favoritesService.getFavorites();
    const allItems = [...this.recommended, ...this.availableThisWeek];
    allItems.forEach(item => {
      item.liked = favorites.some(f => f.title === item.name);
    });
  }

  chatbotOpen = false;
}