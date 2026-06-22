import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { AdminRestaurantApiItem, RestaurantReview } from '../../../../core/model/restaurant.model';
import { environment } from '../../../../../environments/environment';
@Component({
  selector: 'app-admin-restaurants',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './restaurants.html',
  styleUrls: ['../../admin-shared.css', './restaurants.css'],
})
export class AdminRestaurants implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 4;

  restaurants: AdminRestaurantApiItem[] = [];

  // ── Toast ──────────────────────────────────
  deleteToastVisible = false;
  deleteToastSuccess = true;
  deleteToastMessage = '';

  // ── Confirm Delete Restaurant Modal ─────────
  confirmDeleteVisible = false;
  restaurantToDelete: AdminRestaurantApiItem | null = null;

  // ── Reviews Modal ───────────────────────────
  reviewsModalVisible           = false;
  selectedRestaurantName        = '';
  selectedRestaurantReviews: RestaurantReview[] = [];
  selectedRestaurantId: number | null = null;

  // ── Confirm Delete Review Modal ─────────────
  reviewToDelete: RestaurantReview | null = null;

  stats = [
    { label: 'Total Restaurants', value: 0, icon: '🍽', type: 'total'    },
    { label: 'Active',            value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',          value: 0, icon: '⊘',  type: 'inactive' },
  ];

  constructor(
    private router: Router,
    private restaurantService: RestaurantService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token') ?? '';

    this.restaurantService.getAdminRestaurants(token).subscribe({
      next: res => {
        this.stats[0].value = res.totalRestaurants;
        this.stats[1].value = res.activeRestaurants;
        this.stats[2].value = res.inactiveRestaurants;
        this.restaurants    = res.restaurants;
        this.currentPage    = 1;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load admin restaurants:', err),
    });
  }

  // ── Filtering & Pagination ──────────────────
  get filteredAll(): AdminRestaurantApiItem[] {
    if (!this.searchQuery.trim()) return this.restaurants;
    return this.restaurants.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filtered(): AdminRestaurantApiItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) || 1 },
      (_, i) => i + 1
    );
  }

  onSearch(): void { this.currentPage = 1; }
  goToPage(p: number): void { this.currentPage = p; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages.length) this.currentPage++; }

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

  // ── Navigation ──────────────────────────────
  viewOnSite(r: AdminRestaurantApiItem): void {
    window.open(`/restaurant/details/${r.id}`, '_blank');
  }

  edit(r: AdminRestaurantApiItem): void {
    this.router.navigate(['/admin/restaurants/manage'], { queryParams: { id: r.id } });
  }

  // ── Delete Restaurant Flow ───────────────────
  delete(r: AdminRestaurantApiItem): void {
    this.restaurantToDelete  = r;
    this.confirmDeleteVisible = true;
  }

  cancelDelete(): void {
    this.confirmDeleteVisible = false;
    this.restaurantToDelete  = null;
  }

  confirmDelete(): void {
    if (!this.restaurantToDelete) return;
    const r = this.restaurantToDelete;
    this.confirmDeleteVisible = false;
    this.restaurantToDelete  = null;

    const token = localStorage.getItem('token') ?? '';

    this.restaurantService.deleteRestaurant(r.id, token).subscribe({
      next: () => {
        this.restaurants = this.restaurants.filter(x => x.id !== r.id);
        this.stats[0].value = this.restaurants.length;
        this.stats[1].value = this.restaurants.filter(x => x.status === 'Active').length;
        this.stats[2].value = this.restaurants.filter(x => x.status === 'Inactive').length;
        const newTotalPages = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
        if (this.currentPage > newTotalPages) this.currentPage = newTotalPages;
        this.showToast(true, `"${r.name}" deleted successfully.`);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Delete failed:', err);
        this.showToast(false, `Failed to delete "${r.name}". Please try again.`);
      },
    });
  }

  // ── Reviews Modal ───────────────────────────
  openReviews(r: AdminRestaurantApiItem): void {
    this.selectedRestaurantId   = r.id;
    this.selectedRestaurantName = r.name;
    this.reviewsModalVisible    = true;

    const token = localStorage.getItem('token') ?? '';

    // ✅ admin endpoint بدل الـ public endpoint
    this.restaurantService.getAdminReviews(r.id, token).subscribe({
      next: reviews => {
        this.selectedRestaurantReviews = reviews;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load reviews:', err),
    });
  }

  closeReviewsModal(): void {
    this.reviewsModalVisible       = false;
    this.selectedRestaurantId      = null;
    this.selectedRestaurantReviews = [];
    this.reviewToDelete            = null;
  }

  // ── Delete Review Flow ───────────────────────
  requestDeleteReview(review: RestaurantReview): void {
    this.reviewToDelete = review;
  }

  cancelDeleteReview(): void {
    this.reviewToDelete = null;
  }

  confirmDeleteReview(): void {
    if (!this.reviewToDelete) return;

    const review = this.reviewToDelete;
    const token  = localStorage.getItem('token') ?? '';

    this.restaurantService.deleteReviewAdmin(
      this.selectedRestaurantId!,
      review.id,
      token
    ).subscribe({
      next: () => {
        this.selectedRestaurantReviews =
          this.selectedRestaurantReviews.filter(r => r.id !== review.id);
        this.reviewToDelete = null;
        this.showToast(true, `Review by "${review.userName}" removed.`);
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to delete review:', err);
        this.reviewToDelete = null;
        this.showToast(false, `Failed to remove review. Please try again.`);
        this.cdr.detectChanges();
      },
    });
  }
}