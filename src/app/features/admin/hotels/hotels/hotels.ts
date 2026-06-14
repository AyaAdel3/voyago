import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../../../core/services/hotel.service';
import { AdminHotelApiItem, HotelReview } from '../../../../core/model/hotel.model';

@Component({
  selector: 'app-admin-hotels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hotels.html',
  styleUrls: ['../../admin-shared.css', './hotels.css'],
})
export class AdminHotels implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 4;

  hotels: AdminHotelApiItem[] = [];
  loadingHotels = true;
  loadError     = false;

  // ── Toast ──────────────────────────────────
  deleteToastVisible = false;
  deleteToastSuccess = true;
  deleteToastMessage = '';

  // ── Confirm Delete Hotel Modal ──────────────
  confirmDeleteVisible = false;
  hotelToDelete: AdminHotelApiItem | null = null;
  deletingHotel = false;

  // ── Reviews Modal ───────────────────────────
  reviewsModalVisible        = false;
  selectedHotelName          = '';
  selectedHotelReviews: HotelReview[] = [];
  selectedHotelId: number | null = null;

  // ── Confirm Delete Review Modal ─────────────
  reviewToDelete: HotelReview | null = null;

  stats = [
    { label: 'Total Hotels',  value: 0, icon: '🏨', type: 'total'    },
    { label: 'Active',        value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',      value: 0, icon: '⊘',  type: 'inactive' },
  ];

  constructor(
    private router:       Router,
    private hotelService: HotelService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadHotels();
  }

  private loadHotels(): void {
    const token = localStorage.getItem('token') ?? '';
    this.loadingHotels = true;
    this.loadError     = false;

    this.hotelService.getAdminHotels(token).subscribe({
      next: (res) => {
        this.hotels         = res.hotels;
        this.stats[0].value = res.totalHotels;
        this.stats[1].value = res.activeHotels;
        this.stats[2].value = res.inactiveHotels;
        this.loadingHotels  = false;
        this.currentPage    = 1;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingHotels = false;
        this.loadError     = true;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Search & Pagination ───────────────────────────────────

  get filteredAll(): AdminHotelApiItem[] {
    if (!this.searchQuery.trim()) return this.hotels;
    return this.hotels.filter(h =>
      h.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filtered(): AdminHotelApiItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  onSearch(): void { this.currentPage = 1; }

  // ── Toast ───────────────────────────────────

  showToast(success: boolean, msg: string): void {
    this.deleteToastSuccess = success;
    this.deleteToastMessage = msg;
    this.deleteToastVisible  = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // ── Actions ───────────────────────────────────────────────

  viewOnSite(hotel: AdminHotelApiItem): void {
    window.open(`/hotels/details/${hotel.id}`, '_blank');
  }

  edit(hotel: AdminHotelApiItem): void {
    this.router.navigate(['/admin/hotels/manage'], { queryParams: { id: hotel.id } });
  }

  // ── Delete Hotel Flow ────────────────────────

  delete(hotel: AdminHotelApiItem): void {
    this.hotelToDelete       = hotel;
    this.confirmDeleteVisible = true;
  }

  cancelDelete(): void {
    if (this.deletingHotel) return;
    this.confirmDeleteVisible = false;
    this.hotelToDelete        = null;
  }

  confirmDelete(): void {
    if (!this.hotelToDelete || this.deletingHotel) return;

    const hotel = this.hotelToDelete;
    const token = localStorage.getItem('token') ?? '';
    this.deletingHotel = true;

    this.hotelService.deleteHotelAdmin(hotel.id, token).subscribe({
      next: () => {
        this.hotels = this.hotels.filter(h => h.id !== hotel.id);
        this.stats[0].value = this.hotels.length;
        this.stats[1].value = this.hotels.filter(h => h.status === 'Active').length;
        this.stats[2].value = this.hotels.filter(h => h.status === 'Inactive').length;

        const newTotalPages = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
        if (this.currentPage > newTotalPages) this.currentPage = newTotalPages;

        this.deletingHotel        = false;
        this.confirmDeleteVisible = false;
        this.hotelToDelete        = null;

        this.showToast(true, `"${hotel.name}" deleted successfully.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.deletingHotel        = false;
        this.confirmDeleteVisible = false;
        this.hotelToDelete        = null;

        this.showToast(false, `Failed to delete "${hotel.name}". Please try again.`);
        this.cdr.detectChanges();
      },
    });
  }

  // ── Reviews Modal ───────────────────────────

  openReviews(hotel: AdminHotelApiItem): void {
    this.selectedHotelId     = hotel.id;
    this.selectedHotelName   = hotel.name;
    this.reviewsModalVisible = true;

    const token = localStorage.getItem('token') ?? '';

    this.hotelService.getAdminReviews(hotel.id, token).subscribe({
      next: reviews => {
        this.selectedHotelReviews = reviews;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load reviews:', err),
    });
  }

  closeReviewsModal(): void {
    this.reviewsModalVisible  = false;
    this.selectedHotelId      = null;
    this.selectedHotelReviews = [];
    this.reviewToDelete       = null;
  }

  // ── Delete Review Flow ───────────────────────

  requestDeleteReview(review: HotelReview): void {
    this.reviewToDelete = review;
  }

  cancelDeleteReview(): void {
    this.reviewToDelete = null;
  }

  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;

    const review = this.reviewToDelete;
    const token  = localStorage.getItem('token') ?? '';

    this.hotelService.deleteReviewAdmin(
      this.selectedHotelId!,
      review.id,
      token
    ).subscribe({
      next: () => {
        this.selectedHotelReviews =
          this.selectedHotelReviews.filter(r => r.id !== review.id);
        this.reviewToDelete = null;
        this.showToast(true, `Review by "${review.userName}" removed.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviewToDelete = null;
        this.showToast(false, `Failed to remove review. Please try again.`);
        this.cdr.detectChanges();
      },
    });
  }
}