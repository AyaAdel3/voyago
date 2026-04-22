import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// نفس عدد الـ attractions اللي في card.ts
const ATTRACTIONS_COUNT = 3;

@Component({
  selector: 'app-admin-attractions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './attractions.html',
  styleUrls: ['../../admin-shared.css','./attractions.css'],
})
export class AdminAttractions {
  searchQuery = '';
  currentPage = 1;
  totalPages = [1, 2, 3, 4, 10];

  // 👇 نفس الداتا اللي في الكارد (لازم تبقى متطابقة)
  attractions = [
    {
      id: 1,
      name: 'Wadi El Hitan Protected Area',
      location: 'Fayoum, Egypt',
      category: 'Historical',
      rating: 4,
      fee: 100,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Wadi El Rayan Waterfalls',
      location: 'Fayoum, Egypt',
      category: 'Nature',
      rating: 5,
      fee: 80,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Lake Qarun',
      location: 'Fayoum, Egypt',
      category: 'Nature',
      rating: 4,
      fee: 50,
      status: 'Active'
    }
  ];

  stats = [
    { label: 'Total Attractions', value: ATTRACTIONS_COUNT, icon: '🗺', type: 'total' },
    { label: 'Active', value: ATTRACTIONS_COUNT, icon: '✓', type: 'active' },
    { label: 'Inactive', value: 0, icon: '⊘', type: 'inactive' },
    { label: 'Blocked', value: 0, icon: '⚠', type: 'blocked' },
  ];

  constructor(private router: Router) {}

  get filtered() {
    if (!this.searchQuery) return this.attractions;
    return this.attractions.filter(a =>
      a.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  viewOnSite(a: any) {
    window.open(`/tourist-attraction/details/${a.id}`, '_blank');
  }

  edit(a: any) {
    this.router.navigate(['/admin/attractions/manage'], {
      queryParams: { id: a.id },
    });
  }

  delete(a: any) {
    if (confirm(`Delete "${a.name}"?`)) {
      this.attractions = this.attractions.filter(x => x.id !== a.id);

      // 👇 تحديث الستات زي الداشبورد
      this.stats[0].value = this.attractions.length;
      this.stats[1].value = this.attractions.length;
    }
  }
}