import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AttractionService, AttractionDetails, AttractionImage } from '../../../core/services/attraction.service';

@Component({
  selector: 'app-tourist-attraction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class TouristAttractionDetails implements OnInit, OnDestroy {
  attraction: AttractionDetails | undefined;
  isLoading = true;
  error: string | null = null;

  activeImage = 0;
  lightboxOpen = false;
  lbIndex = 0;

  fallbackImage = 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=500&fit=crop';

  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attractionService: AttractionService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sub = this.attractionService.getById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.attraction = data;
      },
      error: (err) => {
        console.error('Error fetching attraction details:', err);
        this.error = 'Failed to load attraction details. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    document.body.style.overflow = '';
  }

  getImageUrl(img: AttractionImage): string {
    return img?.imageUrl ?? this.fallbackImage;
  }

  getImageByIndex(index: number): string {
    if (!this.attraction?.images?.length) return this.fallbackImage;
    return this.attraction.images[index]?.imageUrl ?? this.fallbackImage;
  }

  goBack() { this.router.navigate(['/Attractions']); }

  setActiveImage(index: number): void { this.activeImage = index; }

  openLightbox(index: number): void {
    this.lbIndex = index;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }

  lbNext(): void {
    if (this.attraction && this.lbIndex < this.attraction.images.length - 1) this.lbIndex++;
  }
}