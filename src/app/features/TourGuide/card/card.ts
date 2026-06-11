import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Details } from '../details/details';

import { FavoritesService } from '../../../core/services/favorites.service';

import {
  TourGuideService,
  TourGuide
} from '../../../core/services/tour-guide.service';

import { Subscription, timeout } from 'rxjs';
import { finalize } from 'rxjs/operators';

export type { TourGuide };

@Component({
  selector: 'app-tour-guide-card',
  standalone: true,
  imports: [CommonModule, Details],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, OnDestroy {

  guides: TourGuide[] = [];

  loading = true;
  error = '';

  selectedGuide: TourGuide | null = null;

  private sub!: Subscription;

  constructor(
    private favoritesService: FavoritesService,
    private tourGuideService: TourGuideService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.loading = true;

    this.sub = this.tourGuideService.getAll().pipe(
      timeout(8000),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({

      next: (data) => {

        this.guides = data;

        this.cdr.detectChanges();
      },

      error: (err) => {

        if (err?.name === 'TimeoutError') {

          this.error =
            'Request timed out. Please check your connection and try again.';

        } else {

          this.error =
            'Failed to load tour guides. Please try again.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onImgError(event: Event): void {

    const img = event.target as HTMLImageElement;

    img.onerror = null;

    img.src =
      `data:image/svg+xml;utf8,
      <svg xmlns='http://www.w3.org/2000/svg'
      width='400'
      height='260'
      viewBox='0 0 400 260'>
      <rect width='400' height='260' fill='%23a3c4eb'/>
      <text x='50%25'
      y='50%25'
      dominant-baseline='middle'
      text-anchor='middle'
      font-size='48'
      fill='%23021526'>👤</text>
      </svg>`;
  }

  trackById(index: number, guide: TourGuide): any {
    return guide.id ?? index;
  }

  getShortDescription(desc: string): string {
    return desc?.length > 100
      ? desc.substring(0, 100) + '...'
      : desc;
  }

  isGuideInFav(name: string): boolean {
    return this.favoritesService.isFavorite(name);
  }

  toggleFav(event: MouseEvent, guide: TourGuide): void {

    event.stopPropagation();

    if (this.isGuideInFav(guide.name)) {

      this.favoritesService.removeFavorite(guide.name);

    } else {

      this.favoritesService.addToFavorites({
        title: guide.name,
        image: guide.image,
        price: guide.pricePerDay + ' LE / day',
        rating: guide.rating,
        type: 'tourGuide'
      });
    }
  }

  openDetails(guide: TourGuide): void {
    this.selectedGuide = guide;
  }

  closeDetails(): void {
    this.selectedGuide = null;
  }
}