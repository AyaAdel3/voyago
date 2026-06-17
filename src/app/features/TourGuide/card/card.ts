import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Details } from '../details/details';
import { ActivatedRoute } from '@angular/router';

import { FavoritesService } from '../../../core/services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

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
  pageSize = 5;
  currentPage = 1;

  private sub!: Subscription;

  constructor(
    private favoritesService: FavoritesService,
    private authService:      AuthService,
    private authModal:        AuthModalService,
    private tourGuideService: TourGuideService,
    private cdr:              ChangeDetectorRef,
    private route:            ActivatedRoute       // ← إضافة
  ) {}

  get totalPages(): number {
    return Math.ceil(this.guides.length / this.pageSize);
  }

  get pagedGuides(): TourGuide[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.guides.slice(start, start + this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  ngOnInit(): void {
    this.loading = true;

    if (this.authService.isLoggedIn()) {
      this.favoritesService.getAllFavoritesFromApi().subscribe({
        next: (res) => {
          const items = this.favoritesService.mapApiToFavoriteItems(res);
          this.favoritesService.saveFavorites(items);
          this.cdr.detectChanges();
        }
      });
    }

    this.sub = this.tourGuideService.getAll().pipe(
      timeout(8000),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();

        // ── افتح الـ popup لو جه من الشات ──────────────────
        this.route.queryParams.subscribe(params => {
          const guideId = params['openGuide'];
          if (!guideId) return;

          const id = Number(guideId);

          // أولاً: جرب من الـ guides المحملة
          const fromList = this.guides.find(g => g.id === id);
          if (fromList) {
            this.openDetails(fromList);
            this.cdr.detectChanges();
            return;
          }

          // ثانياً: لو مش موجود في الـ list، جيبه من الـ API مباشرة
          this.tourGuideService.getById_API(id).subscribe({
            next: (guide) => {
              this.openDetails(guide);
              this.cdr.detectChanges();
            },
            error: () => console.warn('Tour guide not found:', id)
          });
        });
        // ────────────────────────────────────────────────────
      })
    ).subscribe({
      next: (data) => {
        this.guides = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.name === 'TimeoutError') {
          this.error = 'Request timed out. Please check your connection and try again.';
        } else {
          this.error = 'Failed to load tour guides. Please try again.';
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

    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();
      return;
    }

    const isFav = this.isGuideInFav(guide.name);

    this.tourGuideService.toggleFavoriteApi(guide.id).subscribe({
      next: () => {
        if (isFav) {
          this.favoritesService.removeFavorite(guide.name);
        } else {
          this.favoritesService.addToFavorites({
            title:  guide.name,
            image:  guide.image,
            price:  guide.pricePerDay + ' LE / day',
            rating: guide.rating,
            type:   'tourGuide'
          });
        }
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to toggle favorite:', err),
    });
  }

  openDetails(guide: TourGuide): void {
    this.selectedGuide = guide;
  }

  closeDetails(): void {
    this.selectedGuide = null;
  }
}