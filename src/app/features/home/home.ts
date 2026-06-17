import { Component, OnInit, OnDestroy, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chatbot } from '../../shared/components/chatbot/chatbot';
import { FavoritesService } from '../../core/services/favorites.service';
import { HomeService, HomeResponse } from '../../core/services/home.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';


const FALLBACK_IMAGE = 'assets/images/placeholder.jpg';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Chatbot, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {

  currentOfferIndex = 0;
  recommendedIndex = 0;
  availableIndex = 0;
  private autoSlideInterval: any;

  offers: any[] = [];
  recommended: any[] = [];
  availableThisWeek: any[] = [];
  isLoading = true;
  chatbotOpen = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private favoritesService: FavoritesService,
    private homeService: HomeService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private injector: Injector
  ) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.favoritesService.getAllFavoritesFromApi().subscribe({
          next: (res) => {
            const items = this.favoritesService.mapApiToFavoriteItems(res);
            this.favoritesService.saveFavorites(items);
            this.cdr.detectChanges();
          }
        });
      }
    }, { injector: this.injector });
  }

  ngOnInit() {
    let favLoaded = !this.authService.isLoggedIn();
    let homeLoaded = false;

    const tryRender = () => {
      if (favLoaded && homeLoaded) {
        this.cdr.detectChanges();
      }
    };

    if (this.authService.isLoggedIn()) {
      this.favoritesService.getAllFavoritesFromApi().subscribe({
        next: (res) => {
          const items = this.favoritesService.mapApiToFavoriteItems(res);
          this.favoritesService.saveFavorites(items);
          favLoaded = true;
          tryRender();
        },
        error: () => {
          favLoaded = true;
          tryRender();
        }
      });
    }

    this.homeService.getHomeData().subscribe({
      next: (data: HomeResponse) => {
        this.offers = data.offers.map((o: any) => ({
          id: o.id,
          title: `${o.name} — ${o.discount}% OFF`,
          image: o.mainImageUrl || FALLBACK_IMAGE,
          location: o.location,
          discount: o.discount,
        }));

        const hotels = data.recommended.hotels.map((h: any) => ({
          ...h,
          price: `${h.minPrice} - ${h.maxPrice} LE`,
          image: h.mainImageUrl || FALLBACK_IMAGE,
          itemType: 'hotel',
        }));

        const restaurants = data.recommended.restaurants.map((r: any) => ({
          ...r,
          price: `${r.minPrice} - ${r.maxPrice} LE`,
          image: r.mainImageUrl || FALLBACK_IMAGE,
          itemType: 'restaurant',
        }));

        const attractions = data.recommended.attractions.map((a: any) => ({
          ...a,
          price: '',
          image: a.mainImageUrl || FALLBACK_IMAGE,
          itemType: 'attraction',
        }));

        this.recommended = [...hotels, ...restaurants, ...attractions];

        this.availableThisWeek = data.availableThisWeek.map((i: any) => ({
          ...i,
          price: `${i.minPrice} - ${i.maxPrice} LE`,
          image: i.mainImageUrl || FALLBACK_IMAGE,
          itemType: i.type?.toLowerCase() || 'hotel',
        }));

        this.isLoading = false;
        this.startAutoSlide();
        homeLoaded = true;
        tryRender();
      },
      error: (err: any) => {
        console.error('Home API error:', err);
        this.isLoading = false;
        homeLoaded = true;
        tryRender();
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.autoSlideInterval);
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      if (this.offers.length) {
        this.currentOfferIndex = (this.currentOfferIndex + 2) % this.offers.length;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    }, 3000);
  }

  get visibleOffers() {
    const len = this.offers.length;
    if (!len) return [];
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

  getDetailsRoute(item: any): string {
    switch (item.itemType) {
      case 'hotel':
        return `/hotels/details/${item.id}`;
      case 'restaurant':
        return `/restaurant/details/${item.id}`;
      case 'attraction':
        return `/tourist-attraction/details/${item.id}`;
      default:
        return '/home';
    }
  }

  isItemLiked(item: any): boolean {
    return this.favoritesService.isFavorite(item.name);
  }

  toggleLike(item: any) {
    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }

    const isFav = this.favoritesService.isFavorite(item.name);

    this.favoritesService.toggleFavoriteApi(item.itemType, item.id).subscribe({
      next: () => {
        if (isFav) {
          this.favoritesService.removeFavorite(item.name);
        } else {
          this.favoritesService.addToFavorites({
            id:     item.id,
            title:  item.name,
            image:  item.image,
            price:  item.price,
            rating: item.rating,
            type:   item.itemType as 'hotel' | 'restaurant' | 'tourGuide' | 'attraction'
          });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Toggle favorite failed:', err);
      }
    });
  }
}