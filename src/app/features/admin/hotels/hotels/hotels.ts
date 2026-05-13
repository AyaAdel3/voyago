import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../../../core/services/hotel.service';
import { Hotel, Review } from '../../../../core/model/hotel.model';

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

  hotels: (Hotel & { status: string })[] = [];

  deleteToastVisible = false;
  deleteToastMessage = '';

  // ── Reviews Modal ──────────────────────────
  reviewsModalVisible = false;
  selectedHotelName   = '';
  selectedHotelReviews: Review[] = [];
  selectedHotelId: number | null = null;

  stats = [
    { label: 'Total Hotels', value: 0, icon: '🏨', type: 'total'    },
    { label: 'Active',       value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',     value: 0, icon: '⊘',  type: 'inactive' },
    { label: 'Blocked',      value: 0, icon: '⚠',  type: 'blocked'  },
  ];

  constructor(
    private router: Router,
    private hotelService: HotelService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe(hotels => {
      this.hotels = hotels.map(h => ({
        ...h,
        status: (h as any).status ?? 'Active',
      }));
      this.currentPage = 1;
      this.updateStats();
      this.cdr.detectChanges();
    });
  }

  updateStats(): void {
    this.stats[0].value = this.hotels.length;
    this.stats[1].value = this.hotels.filter(h => h.status === 'Active').length;
    this.stats[2].value = this.hotels.filter(h => h.status === 'Inactive').length;
    this.stats[3].value = this.hotels.filter(h => h.status === 'Blocked').length;
  }

  // ── كل البيانات المفلترة (بدون pagination) ──
  get filteredAll() {
    if (!this.searchQuery.trim()) return this.hotels;
    return this.hotels.filter(h =>
      h.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // ── الصفحة الحالية فقط ──
  get filtered() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  // ── عدد الصفحات ──
  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  showDeleteToast(msg: string) {
    this.deleteToastMessage = msg;
    this.deleteToastVisible = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 6000);
  }

  viewOnSite(hotel: Hotel) {
    window.open(`/hotels/details/${hotel.id}`, '_blank');
  }

  edit(hotel: Hotel) {
    this.router.navigate(['/admin/hotels/manage'], { queryParams: { id: hotel.id } });
  }

  delete(hotel: Hotel) {
    this.hotelService.deleteHotel(hotel.id);
    this.showDeleteToast(`"${hotel.name}" deleted successfully.`);
  }

  // ── Reviews Modal ──────────────────────────────────────

  openReviews(hotel: Hotel) {
    this.selectedHotelId   = hotel.id;
    this.selectedHotelName = hotel.name;
    this.hotelService.getReviews(hotel.id).subscribe(reviews => {
      this.selectedHotelReviews = reviews;
      this.cdr.detectChanges();
    });
    this.reviewsModalVisible = true;
  }

  closeReviewsModal() {
    this.reviewsModalVisible  = false;
    this.selectedHotelId      = null;
    this.selectedHotelReviews = [];
  }

  deleteReview(review: Review) {
    this.hotelService.deleteReview(review.id);
    this.selectedHotelReviews = this.selectedHotelReviews.filter(r => r.id !== review.id);
    this.showDeleteToast(`Review by "${review.userName}" removed.`);
  }
}