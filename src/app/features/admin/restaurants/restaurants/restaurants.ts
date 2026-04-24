import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { Restaurant } from '../../../../core/model/restaurant.model';

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
  totalPages  = [1, 2, 3, 4, 10];

  restaurants: (Restaurant & { status: string })[] = [];

  deleteToastVisible = false;
  deleteToastMessage = '';

  stats = [
    { label: 'Total Restaurants', value: 0, icon: '🍽', type: 'total'    },
    { label: 'Active',            value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',          value: 0, icon: '⊘',  type: 'inactive' },
    { label: 'Blocked',           value: 0, icon: '⚠',  type: 'blocked'  },
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
      this.updateStats();
    });
  }

  updateStats(): void {
    this.stats[0].value = this.restaurants.length;
    this.stats[1].value = this.restaurants.filter(r => r.status === 'Active').length;
    this.stats[2].value = this.restaurants.filter(r => r.status === 'Inactive').length;
    this.stats[3].value = this.restaurants.filter(r => r.status === 'Blocked').length;
  }

  get filtered() {
    if (!this.searchQuery) return this.restaurants;
    return this.restaurants.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  showDeleteToast(msg: string) {
    this.deleteToastMessage = msg;
    this.deleteToastVisible = true;
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
}