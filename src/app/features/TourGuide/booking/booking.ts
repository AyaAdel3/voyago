import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourGuideService } from '../../../core/services/tour-guide.service';

export interface TourGuideBookingData {
  guideId:    number;
  guideName:  string;
  guideImage: string;
  date:       string;
  time:       string;
  days:       number;
  totalPrice: number;
  bookingId:  number;   // ← الـ numeric ID من الـ API عشان نبعته في confirm
}

@Component({
  selector: 'app-tour-guide-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit {
  booking: TourGuideBookingData | null = null;

  selectedMethod: 'credit' | 'cash' = 'credit';
  isProcessing = false;

  cardNumber   = '';
  expiryDate   = '';
  cvv          = '';
  cvvInputType = 'text';

  cardError   = '';
  expiryError = '';
  cvvError    = '';

  get depositAmount(): number {
    return Math.round((this.booking?.totalPrice ?? 0) * 0.3);
  }

  constructor(
    private router:          Router,
    private tourGuideService: TourGuideService,
  ) {}

  ngOnInit(): void {
    const state = history.state;

    if (state?.bookingResult) {
      const res   = state.bookingResult;
      const guide = state.guide;

      this.booking = {
        guideId:    guide.id,
        guideName:  res.tourGuideName  ?? guide.name,
        guideImage: guide.image        ?? guide.profilePictureUrl ?? '',
        date:       res.bookingDate,
        time:       '09:00 AM',
        days:       res.numberOfDays,
        totalPrice: res.totalPrice,
        bookingId:  res.bookingId,   // ← بيتحفظ من الـ API response
      };

      sessionStorage.setItem('tourGuideBooking', JSON.stringify(this.booking));
      return;
    }

    const raw = sessionStorage.getItem('tourGuideBooking');
    if (!raw) {
      this.router.navigate(['/tour-guide']);
      return;
    }
    this.booking = JSON.parse(raw);
  }

  selectMethod(m: 'credit' | 'cash'): void {
    this.selectedMethod = m;
    this.resetFields();
  }

  private resetFields(): void {
    this.cardNumber  = '';
    this.expiryDate  = '';
    this.cvv         = '';
    this.cardError   = '';
    this.expiryError = '';
    this.cvvError    = '';
  }

  formatCard(): void {
    this.cardError  = '';
    this.cardNumber = this.cardNumber
      .replace(/\D/g, '').substring(0, 16)
      .replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(): void {
    this.expiryError = '';
    let val = this.expiryDate.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    this.expiryDate = val;
  }

  onCvvFocus(): void { this.cvvInputType = 'password'; }
  onCvvBlur():  void { if (!this.cvv) this.cvvInputType = 'text'; }

  formatCvv(): void {
    this.cvvError = '';
    this.cvv = this.cvv.replace(/\D/g, '').substring(0, 3);
  }

  isValidCard(): boolean {
    const digits = this.cardNumber.replace(/\s/g, '');
    return digits.length === 16 && this.luhnCheck(digits);
  }

  isValidExpiry(): boolean {
    if (!/^\d{2}\/\d{2}$/.test(this.expiryDate)) return false;
    const [mm, yy] = this.expiryDate.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const now      = new Date();
    const cardYear = 2000 + yy;
    return cardYear > now.getFullYear() ||
      (cardYear === now.getFullYear() && mm >= now.getMonth() + 1);
  }

  isValidCvv(): boolean { return this.cvv.length === 3; }

  private luhnCheck(num: string): boolean {
    let sum = 0, shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  confirmBooking(): void {
    if (!this.booking) return;
    this.cardError = this.expiryError = this.cvvError = '';
    let hasError = false;

    if (!this.isValidCard())   { this.cardError   = 'Please enter a valid card number.'; hasError = true; }
    if (!this.isValidExpiry()) { this.expiryError = 'Please enter a valid expiry date.'; hasError = true; }
    if (!this.isValidCvv())    { this.cvvError    = 'Please enter a valid CVV.';         hasError = true; }
    if (hasError) return;

    this.isProcessing = true;

    const paymentType = this.selectedMethod === 'credit' ? 'card' : 'cash on arrival';

    this.tourGuideService
      .confirmBooking(this.booking.guideId, this.booking.bookingId, paymentType)
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.router.navigate(['/tour-guide/booking-confirmed'], {
            queryParams: {
              bookingId: `TG-${this.booking!.bookingId}`,
              method:    this.selectedMethod,
              deposit:   this.selectedMethod === 'cash' ? this.depositAmount : null,
            },
          });
        },
        error: (err) => {
          console.error('Confirm booking failed:', err);
          this.isProcessing = false;
        },
      });
  }
}