import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selectedTime: string = '18:00-19:00';
  days: number = 1;
  paymentMethod: 'arrival' | 'online' | '' = '';
  isLoading = false;
  errorMessage = '';

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
    if (!this.selectedDate) { this.errorMessage = 'Please select a date.'; return; }
    if (!this.paymentMethod) { this.errorMessage = 'Please select a payment method.'; return; }
    if (this.days < 1) { this.errorMessage = 'Duration must be at least 1 day.'; return; }
    this.errorMessage = '';
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      alert('Booking confirmed! Total: ' + this.totalPrice + ' LE');
      this.onClose();
    }, 1000);
  }
}