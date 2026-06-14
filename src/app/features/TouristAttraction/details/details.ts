import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  AttractionService,
  AttractionDetails,
  AttractionImage
} from '../../../core/services/attraction.service';

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

  fallbackImage =
    'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=500&fit=crop';

  private sub!: Subscription;

constructor(
  private route: ActivatedRoute,
  private router: Router,
  private attractionService: AttractionService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));

      this.loadAttraction(id);
    });
  }

 loadAttraction(id: number): void {

  this.isLoading = true;

  this.error = null;

  this.attraction = undefined;

  this.sub = this.attractionService.getById(id)
    .pipe(
      finalize(() => {

        this.isLoading = false;

        this.cdr.detectChanges();
      })
    )
    .subscribe({

   next: (data) => {
  this.attraction = data;
  console.log('Images count:', data.images?.length); // ضيف السطر ده
  console.log('Images:', data.images);               // وده
  this.activeImage = 0;
  this.cdr.detectChanges();
},

      error: (err) => {

        console.error(err);

        this.error =
          'Failed to load attraction details. Please try again.';

        this.cdr.detectChanges();
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

    if (!this.attraction?.images?.length) {
      return this.fallbackImage;
    }

    return (
      this.attraction.images[index]?.imageUrl ??
      this.fallbackImage
    );
  }

  goBack(): void {

    this.router.navigate(['/Attractions']);
  }

  setActiveImage(index: number): void {

    this.activeImage = index;
  }

  openLightbox(index: number): void {

    this.lbIndex = index;

    this.lightboxOpen = true;

    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {

    this.lightboxOpen = false;

    document.body.style.overflow = '';
  }

  lbPrev(): void {

    if (this.lbIndex > 0) {
      this.lbIndex--;
    }
  }

  lbNext(): void {

    if (
      this.attraction &&
      this.lbIndex < this.attraction.images.length - 1
    ) {
      this.lbIndex++;
    }
  }
}