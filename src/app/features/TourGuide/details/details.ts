import { Component, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourGuide } from '../card/card';
import { TourGuideService } from '../../../core/services/tour-guide.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

@Component({
  selector: 'app-tour-guide-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
  encapsulation: ViewEncapsulation.None
})
export class Details implements OnInit {
  @Input() guide!: TourGuide;
  @Output() closeDetails = new EventEmitter<void>();

  fullGuide: TourGuide | null = null;
  loadingDetails = true;

  selectedDate: string = '';
  days: number = 1;
  errorMessage = '';
  isLoading = false;
  showLoginPrompt = false;

  constructor(
    private tourGuideService: TourGuideService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tourGuideService.getById_API(this.guide.id).subscribe({
      next: (data) => {
        this.fullGuide = { ...data, image: data.profilePictureUrl };
        this.loadingDetails = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.fullGuide = this.guide;
        this.loadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalPrice(): number {
    return (this.fullGuide?.pricePerDay ?? this.guide.pricePerDay) * this.days;
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  incrementDays(): void { this.days++; }
  decrementDays(): void { if (this.days > 1) this.days--; }
  onClose(): void { this.closeDetails.emit(); }

  goToLogin(): void {
    this.closeDetails.emit();
    this.authModal.openLogin();
  }

  private extractErrorMessage(err: any): string {
    if (err.status === 0)   return 'Connection error. Please try again later.';
    if (err.status === 401) return 'Please log in to book a tour guide.';
    if (err.status === 404) return 'Tour guide not found.';
    const errors = err?.error?.errors;
    if (Array.isArray(errors) && errors.length > 0) return errors[errors.length - 1];
    return err?.error?.message || err?.error?.title || 'Something went wrong. Please try again.';
  }

  onBookNow(): void {
    this.errorMessage    = '';
    this.showLoginPrompt = false;

    // ✅ لو admin → logout وعامله كـ guest
    if (this.authService.isAdmin()) {
      this.authService.logout();
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return;
    }

    // ✅ لو مش logged in → عرض login prompt
    if (!this.authService.isLoggedIn()) {
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return;
    }

    if (!this.selectedDate) { this.errorMessage = 'Please select a date.'; return; }
    if (this.days < 1)      { this.errorMessage = 'Duration must be at least 1 day.'; return; }

    this.isLoading = true;

    this.tourGuideService.bookGuide(this.guide.id, this.selectedDate, this.days).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        this.closeDetails.emit();
        this.router.navigate(['/tour-guide/booking'], {
          state: {
            bookingResult: res,
            guide: this.fullGuide ?? this.guide
          }
        });
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = this.extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}