import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingData } from '../../../core/model/hotel.model';
import { HotelService } from '../../../core/services/hotel.service';

@Component({
  selector: 'app-hotel-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit {
  booking: BookingData | null = null;
  selectedMethod: 'credit' | 'cash' = 'credit';
  isProcessing = false;

  cardNumber = '';
  expiryDate = '';
  cvv        = '';

  cardError   = '';
  expiryError = '';
  cvvError    = '';

  get depositAmount(): number {
    return Math.round((this.booking?.totalAmount ?? 0) * 0.3);
  }

  constructor(
    private hotelService: HotelService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.booking = this.hotelService.getBooking();
    if (!this.booking) { this.router.navigate(['/hotels']); }
  }

  selectMethod(m: 'credit' | 'cash'): void {
    this.selectedMethod = m;
    this.resetFields();
  }

  private resetFields(): void {
    this.cardNumber = '';
    this.expiryDate = '';
    this.cvv        = '';
    this.cardError  = '';
    this.expiryError = '';
    this.cvvError   = '';
  }

  formatCard(): void {
    this.cardError  = '';
    this.cardNumber = this.cardNumber
      .replace(/\D/g, '')
      .substring(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  formatExpiry(): void {
    this.expiryError = '';
    let val = this.expiryDate.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    this.expiryDate = val;
  }

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
    const now       = new Date();
    const cardYear  = 2000 + yy;
    const cardMonth = mm;
    return (
      cardYear > now.getFullYear() ||
      (cardYear === now.getFullYear() && cardMonth >= now.getMonth() + 1)
    );
  }

  isValidCvv(): boolean {
    return this.cvv.length === 3;
  }

  private luhnCheck(num: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
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
    if (!this.isValidCvv())    { this.cvvError    = 'Please enter a valid CVV.';          hasError = true; }

    if (hasError) return;

    this.isProcessing = true;

    this.hotelService.confirmBooking(this.booking, this.selectedMethod).subscribe({
      next: ({ bookingId }) => {
        this.isProcessing = false;
        this.router.navigate(['/hotels/booking-confirmed'], {
          queryParams: {
            bookingId,
            method: this.selectedMethod,
            deposit: this.selectedMethod === 'cash' ? this.depositAmount : null,
          },
        });
      },
      error: () => {
        this.isProcessing = false;
      },
    });
  }
}