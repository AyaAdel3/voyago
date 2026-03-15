// ============================================================
// booking.ts  →  src/app/features/TourGuide/booking/
// صفحة الدفع بتاعة التور جايد — نفس ستايل هوتيل بوكينج
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// بيانات الحجز اللي بتيجي من الـ details عبر sessionStorage
export interface TourGuideBookingData {
  guideId:    number;
  guideName:  string;
  guideImage: string;
  date:       string;
  time:       string;
  days:       number;
  totalPrice: number;
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

  selectedMethod: 'credit' | 'cash' | 'vodafone' = 'credit';
  isProcessing = false;

  // Credit card fields
  cardNumber  = '';
  expiryDate  = '';
  cvv         = '';

  // Vodafone cash fields
  vodafoneNumber        = '';
  vodafoneOtp           = '';
  otpSent               = false;
  otpSending            = false;
  private otpSentForNumber = '';

  // Cash on arrival deposit method
  depositMethod: 'credit' | 'vodafone' = 'credit';

  // Errors
  cardError     = '';
  expiryError   = '';
  cvvError      = '';
  vodafoneError = '';
  otpError      = '';

  // الـ deposit = 30% من الـ total
  get depositAmount(): number {
    return Math.round((this.booking?.totalPrice ?? 0) * 0.3);
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    // جيب البيانات من الـ sessionStorage
    const raw = sessionStorage.getItem('tourGuideBooking');
    if (!raw) {
      this.router.navigate(['/tour-guide']);
      return;
    }
    this.booking = JSON.parse(raw);
  }

  // ── Payment method selection ──────────────────────────────
  selectMethod(m: 'credit' | 'cash' | 'vodafone'): void {
    this.selectedMethod = m;
    this.resetFields();
  }

  selectDepositMethod(m: 'credit' | 'vodafone'): void {
    this.depositMethod = m;
    this.resetFields();
  }

  private resetFields(): void {
    this.cardNumber       = '';
    this.expiryDate       = '';
    this.cvv              = '';
    this.vodafoneNumber   = '';
    this.vodafoneOtp      = '';
    this.otpSent          = false;
    this.otpSending       = false;
    this.otpSentForNumber = '';
    this.cardError        = '';
    this.expiryError      = '';
    this.cvvError         = '';
    this.vodafoneError    = '';
    this.otpError         = '';
  }

  // ── Card formatting ───────────────────────────────────────
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

  formatCvv(): void {
    this.cvvError = '';
    this.cvv = this.cvv.replace(/\D/g, '').substring(0, 3);
  }

  // ── Validation ────────────────────────────────────────────
  isValidCard(): boolean {
    const digits = this.cardNumber.replace(/\s/g, '');
    return digits.length === 16 && this.luhnCheck(digits);
  }

  isValidExpiry(): boolean {
    if (!/^\d{2}\/\d{2}$/.test(this.expiryDate)) return false;
    const [mm, yy] = this.expiryDate.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const cardYear = 2000 + yy;
    return cardYear > now.getFullYear() ||
      (cardYear === now.getFullYear() && mm >= now.getMonth() + 1);
  }

  isValidCvv(): boolean { return this.cvv.length === 3; }

  isValidVodafoneNumber(): boolean {
    return this.vodafoneNumber.length === 11 &&
      (this.vodafoneNumber.startsWith('010') ||
       this.vodafoneNumber.startsWith('011') ||
       this.vodafoneNumber.startsWith('015'));
  }

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

  // ── OTP ───────────────────────────────────────────────────
  validateVodafoneNumber(): void {
    this.vodafoneError = '';
    this.vodafoneNumber = this.vodafoneNumber.replace(/\D/g, '');
    if (this.otpSent && this.vodafoneNumber !== this.otpSentForNumber) {
      this.otpSent = false; this.otpSending = false;
      this.vodafoneOtp = ''; this.otpError = ''; this.otpSentForNumber = '';
    }
  }

  validateOtp(): void { this.otpError = ''; }

  sendOtp(): void {
    if (!this.isValidVodafoneNumber()) return;
    this.otpSending = true;
    setTimeout(() => {
      this.otpSent = true; this.otpSending = false;
      this.otpSentForNumber = this.vodafoneNumber;
    }, 1500);
  }

  // ── Confirm Booking ───────────────────────────────────────
  confirmBooking(): void {
    if (!this.booking) return;
    this.cardError = this.expiryError = this.cvvError = this.vodafoneError = this.otpError = '';
    let hasError = false;

    if (this.selectedMethod === 'credit') {
      if (!this.isValidCard())   { this.cardError   = 'Please enter a valid card number.'; hasError = true; }
      if (!this.isValidExpiry()) { this.expiryError = 'Please enter a valid expiry date.'; hasError = true; }
      if (!this.isValidCvv())    { this.cvvError    = 'Please enter a valid CVV.';          hasError = true; }
    }

    if (this.selectedMethod === 'vodafone') {
      if (!this.isValidVodafoneNumber()) {
        this.vodafoneError = 'Please enter a valid number starting with 010, 011, or 015.'; hasError = true;
      } else if (!this.otpSent) {
        this.vodafoneError = 'Please send and verify the OTP first.'; hasError = true;
      } else if (this.vodafoneOtp.length < 4) {
        this.otpError = 'Please enter the 4-digit OTP.'; hasError = true;
      }
    }

    if (this.selectedMethod === 'cash') {
      if (this.depositMethod === 'credit') {
        if (!this.isValidCard())   { this.cardError   = 'Please enter a valid card number.'; hasError = true; }
        if (!this.isValidExpiry()) { this.expiryError = 'Please enter a valid expiry date.'; hasError = true; }
        if (!this.isValidCvv())    { this.cvvError    = 'Please enter a valid CVV.';          hasError = true; }
      }
      if (this.depositMethod === 'vodafone') {
        if (!this.isValidVodafoneNumber()) {
          this.vodafoneError = 'Please enter a valid number starting with 010, 011, or 015.'; hasError = true;
        } else if (!this.otpSent) {
          this.vodafoneError = 'Please send and verify the OTP first.'; hasError = true;
        } else if (this.vodafoneOtp.length < 4) {
          this.otpError = 'Please enter the 4-digit OTP.'; hasError = true;
        }
      }
    }

    if (hasError) return;

    this.isProcessing = true;

    // TODO: استبدل بـ HTTP call لما الـ API يجهز
    setTimeout(() => {
      this.isProcessing = false;
      // لا تمسح الـ sessionStorage هنا — الـ confirmed page هتمسحه
      this.router.navigate(['/tour-guide/booking-confirmed'], {
        queryParams: {
          method:  this.selectedMethod,
          deposit: this.selectedMethod === 'cash' ? this.depositAmount : null,
        },
      });
    }, 1200);
  }
}