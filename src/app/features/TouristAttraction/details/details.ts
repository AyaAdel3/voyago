import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AttractionService, Attraction } from '../../../core/services/attraction.service';

@Component({
  selector: 'app-tourist-attraction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class TouristAttractionDetails implements OnInit {
  attraction: Attraction | undefined;
  activeImage = 0;
  lightboxOpen = false;
  lbIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attractionService: AttractionService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.attraction = this.attractionService.getById(id);
  }

  goBack() { this.router.navigate(['/Attractions']); }

  getStars(rating: number): number[] { return Array(rating).fill(0); }

  setActiveImage(index: number): void { this.activeImage = index; }
  openLightbox(index: number): void { this.lbIndex = index; this.lightboxOpen = true; document.body.style.overflow = 'hidden'; }
  closeLightbox(): void { this.lightboxOpen = false; document.body.style.overflow = ''; }
  lbPrev(): void { if (this.lbIndex > 0) this.lbIndex--; }
  lbNext(): void { if (this.attraction && this.lbIndex < this.attraction.images.length - 1) this.lbIndex++; }
}