import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { Restaurant, RestaurantReview } from '../../../../core/model/restaurant.model';

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

  restaurants: (Restaurant & { status: string })[] = [];

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
    this.restaurantService.getRestaurants().subscribe(list => {
      this.restaurants = list.map(r => ({
        ...r,
        status: (r as any).status ?? 'Active',
      }));
      this.currentPage = 1;
      this.updateStats();
      this.cdr.detectChanges();
    });
  }

  updateStats(): void {
    this.stats[0].value = this.restaurants.length;
    this.stats[1].value = this.restaurants.filter(r => r.status === 'Active').length;
    this.stats[2].value = this.restaurants.filter(r => r.status === 'Inactive').length;
  }

  // ── كل البيانات المفلترة (بدون pagination) ──
  get filteredAll() {
    if (!this.searchQuery.trim()) return this.restaurants;
    return this.restaurants.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
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
    this.deleteToastVisible  = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 6000);
  }

  viewOnSite(r: Restaurant) {
    window.open(`/restaurant/details/${r.id}`, '_blank');
  }

  edit(r: Restaurant) {
    this.router.navigate(['/admin/restaurants/manage'], { queryParams: { id: r.id } });
  }

  delete(r: Restaurant) {
    this.restaurantService.deleteRestaurant(r.id);
    this.showDeleteToast(`"${r.name}" deleted successfully.`);
  }

  // ── Reviews Modal ──────────────────────────────────────

  openReviews(restaurant: Restaurant) {
    this.selectedRestaurantId   = restaurant.id;
    this.selectedRestaurantName = restaurant.name;
    this.restaurantService.getReviews(restaurant.id).subscribe(reviews => {
      this.selectedRestaurantReviews = reviews;
      this.cdr.detectChanges();
    });
    this.reviewsModalVisible = true;
  }

  closeReviewsModal() {
    this.reviewsModalVisible       = false;
    this.selectedRestaurantId      = null;
    this.selectedRestaurantReviews = [];
  }

  deleteReview(review: RestaurantReview) {
    this.restaurantService.deleteReview(review.id);
    this.selectedRestaurantReviews =
      this.selectedRestaurantReviews.filter(r => r.id !== review.id);
    this.showDeleteToast(`Review by "${review.userName}" removed.`);
  }
}