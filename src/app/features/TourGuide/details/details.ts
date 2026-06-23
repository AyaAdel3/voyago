import { Component, Input, Output, EventEmitter, ViewEncapsulation, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TourGuide } from '../card/card';
import { TourGuideService, GuideBooking } from '../../../core/services/tour-guide.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalService } from '../../../core/services/auth-modal.service';

interface CalendarDay {
  date: Date | null;
  dateStr: string;
  day: number;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  inCurrentMonth: boolean;
}

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

  // ── Custom calendar / booked-dates state ────────────────
  showCalendar = false;
  loadingBookedDates = true;
  bookedDates: Set<string> = new Set();
  calendarMonth: Date = new Date();
  calendarWeeks: CalendarDay[][] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private tourGuideService: TourGuideService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), 1);

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

    const now = new Date();
    this.loadFullyBookedDates(now.getFullYear(), now.getMonth() + 1);
  }

  private loadFullyBookedDates(year: number, month: number): void {
    this.loadingBookedDates = true;
    this.tourGuideService.getFullyBookedDates(this.guide.id, year, month).subscribe({
      next: (dates) => {
        // كل شهر بيتحمّل بيضيف تواريخه للـ Set (تراكمي)
        dates.forEach(d => this.bookedDates.add(d.split('T')[0]));
        this.loadingBookedDates = false;
        this.buildCalendar();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingBookedDates = false;
        this.buildCalendar();
        this.cdr.detectChanges();
      }
    });
  }

  get totalPrice(): number {
    return (this.fullGuide?.pricePerDay ?? this.guide.pricePerDay) * this.days;
  }

  private checkAuthBeforeInteract(): boolean {
    if (this.authService.isAdmin()) {
      this.authService.forceLogout();
      this.closeDetails.emit();
      this.router.navigate(['/home']);
      return false;
    }
    if (!this.authService.isLoggedIn()) {
      this.showLoginPrompt = true;
      this.cdr.detectChanges();
      return false;
    }
    return true;
  }

  // ══════════════════════════════════════════════════════
  // Booked-dates helpers
  // ══════════════════════════════════════════════════════
  private toDateStr(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  private addDaysToDateStr(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return this.toDateStr(d);
  }

  private hasDateRangeConflict(startDateStr: string, days: number): boolean {
    for (let i = 0; i < days; i++) {
      if (this.bookedDates.has(this.addDaysToDateStr(startDateStr, i))) return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════
  // Calendar rendering
  // ══════════════════════════════════════════════════════
  buildCalendar(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: CalendarDay[] = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.toDateStr(date);
      const isPast = date.getTime() < today.getTime();
      const isBooked = this.bookedDates.has(dateStr);
      cells.push({
        date,
        dateStr,
        day,
        disabled: isPast || isBooked,
        isToday: date.getTime() === today.getTime(),
        isSelected: dateStr === this.selectedDate,
        inCurrentMonth: true
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dateStr: '', day: 0, disabled: true, isToday: false, isSelected: false, inCurrentMonth: false });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    this.calendarWeeks = weeks;
  }

  get monthLabel(): string {
    return this.calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  get canGoPrevMonth(): boolean {
    const today = new Date();
    return !(this.calendarMonth.getFullYear() === today.getFullYear() && this.calendarMonth.getMonth() === today.getMonth());
  }

  get displaySelectedDate(): string {
    if (!this.selectedDate) return 'Select a date';
    const d = new Date(this.selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  prevMonth(): void {
    if (!this.canGoPrevMonth) return;
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
    this.loadFullyBookedDates(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1);
  }

  nextMonth(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
    this.loadFullyBookedDates(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1);
  }

  toggleCalendar(): void {
    if (this.loadingBookedDates) return;
    if (!this.checkAuthBeforeInteract()) return;
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.buildCalendar();
    }
  }

  selectDay(cell: CalendarDay): void {
    if (cell.disabled || !cell.inCurrentMonth) return;
    this.selectedDate = cell.dateStr;
    this.showCalendar = false;
    this.errorMessage = '';
    this.buildCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showCalendar) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-popup') && !target.closest('.date-display-btn')) {
      this.showCalendar = false;
      this.cdr.detectChanges();
    }
  }

  incrementDays(): void {
    if (!this.checkAuthBeforeInteract()) return;
    this.days++;
    this.errorMessage = '';
  }

  decrementDays(): void {
    if (!this.checkAuthBeforeInteract()) return;
    if (this.days > 1) this.days--;
    this.errorMessage = '';
  }

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
    if (!this.checkAuthBeforeInteract()) return;

    if (!this.selectedDate) { this.errorMessage = 'Please select a date.'; return; }
    if (this.days < 1)      { this.errorMessage = 'Duration must be at least 1 day.'; return; }

    if (this.hasDateRangeConflict(this.selectedDate, this.days)) {
      this.errorMessage = 'Selected duration overlaps with an already booked period.';
      return;
    }

    this.errorMessage = '';
    this.isLoading    = true;

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