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
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=3', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=4', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=5', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=6', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=11', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=12', liked: false },
  ];

  availableThisWeek = [
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=7', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=8', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=9', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=10', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=13', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=14', liked: false },
  ];

  get visibleOffers() {
    return [
      this.offers[this.currentOfferIndex % this.offers.length],
      this.offers[(this.currentOfferIndex + 1) % this.offers.length],
    ];
  }

  ngOnInit() {
    this.autoSlideInterval = setInterval(() => {
      this.nextOffer();
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

  toggleLike(item: any) {
    item.liked = !item.liked;

    if (item.liked) {
      this.favoritesService.addToFavorites({
        title: item.name,
        image: item.image,
        price: item.price,
        rating: item.rating,
        type: 'hotel'  // ✅ ده اللي كان ناقص
      });
    } else {
      // ✅ بنبعت الـ title مش الـ index
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