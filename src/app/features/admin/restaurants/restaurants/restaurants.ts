import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { AdminRestaurantApiItem, RestaurantReview } from '../../../../core/model/restaurant.model';

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

  deleteToastVisible = false;
  deleteToastMessage = '';

  // ── Reviews Modal ──────────────────────────
  reviewsModalVisible          = false;
  selectedRestaurantName       = '';
  selectedRestaurantReviews: RestaurantReview[] = [];
  selectedRestaurantId: number | null = null;

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

        this.restaurants = res.restaurants;
        this.currentPage = 1;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load admin restaurants:', err),
    });
  }

  // ── كل البيانات المفلترة (بدون pagination) ──
  get filteredAll(): AdminRestaurantApiItem[] {
    if (!this.searchQuery.trim()) return this.restaurants;
    return this.restaurants.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // ── الصفحة الحالية فقط ──
  get filtered(): AdminRestaurantApiItem[] {
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

  showDeleteToast(msg: string): void {
    this.deleteToastMessage = msg;
    this.deleteToastVisible  = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 6000);
  }

  viewOnSite(r: AdminRestaurantApiItem): void {
    window.open(`/restaurant/details/${r.id}`, '_blank');
  }

  edit(r: AdminRestaurantApiItem): void {
    this.router.navigate(['/admin/restaurants/manage'], { queryParams: { id: r.id } });
  }

  delete(r: AdminRestaurantApiItem): void {
    const token = localStorage.getItem('token') ?? '';

    this.restaurantService.deleteRestaurant(r.id, token).subscribe({
      next: () => {
        this.restaurants = this.restaurants.filter(x => x.id !== r.id);
        this.stats[0].value = this.restaurants.length;
        this.stats[1].value = this.restaurants.filter(x => x.status === 'Active').length;
        this.stats[2].value = this.restaurants.filter(x => x.status === 'Inactive').length;
        this.showDeleteToast(`"${r.name}" deleted successfully.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showDeleteToast(`Failed to delete "${r.name}". Please try again.`);
      },
    });
  }

  // ── Reviews Modal ──────────────────────────────────────

  openReviews(r: AdminRestaurantApiItem): void {
    this.selectedRestaurantId   = r.id;
    this.selectedRestaurantName = r.name;
    this.restaurantService.getReviews(r.id).subscribe(reviews => {
      this.selectedRestaurantReviews = reviews;
      this.cdr.detectChanges();
    });
    this.reviewsModalVisible = true;
  }

  closeReviewsModal(): void {
    this.reviewsModalVisible       = false;
    this.selectedRestaurantId      = null;
    this.selectedRestaurantReviews = [];
  }

  deleteReview(review: RestaurantReview): void {
    this.restaurantService.deleteReview(review.id);
    this.selectedRestaurantReviews =
      this.selectedRestaurantReviews.filter(r => r.id !== review.id);
    this.showDeleteToast(`Review by "${review.userName}" removed.`);
  }
}