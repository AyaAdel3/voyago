import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourGuide } from '../card/card';

@Component({
  selector: 'app-tour-guide-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
  encapsulation: ViewEncapsulation.None
})
export class Details {
  @Input() guide!: TourGuide;
  @Output() closeDetails = new EventEmitter<void>();

  selectedDate: string = '';
  days: number = 1;
  paymentMethod: 'arrival' | 'online' | '' = '';
  errorMessage = '';
  isLoading = false;

  constructor(private router: Router) {}

  get totalPrice(): number {
    return this.guide.pricePerDay * this.days;
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  incrementDays(): void { this.days++; }
  decrementDays(): void { if (this.days > 1) this.days--; }

  onClose(): void { this.closeDetails.emit(); }

  onBookNow(): void {
    if (!this.selectedDate) {
      this.errorMessage = 'Please select a date.';
      return;
    }
    // if (!this.selectedTime) {
    //   this.errorMessage = 'Please select a time.';
    //   return;
    // }
    if (this.days < 1) {
      this.errorMessage = 'Duration must be at least 1 day.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const bookingData = {
      guideId:    this.guide.id,
      guideName:  this.guide.name,
      guideImage: this.guide.image,
      date:       this.selectedDate,

      days:       this.days,
      totalPrice: this.totalPrice,
    };
    sessionStorage.setItem('tourGuideBooking', JSON.stringify(bookingData));

    this.router.navigate(['/tour-guide/booking']);
  }
}