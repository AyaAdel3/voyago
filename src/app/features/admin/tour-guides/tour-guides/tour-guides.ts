import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// 👇 نفس عدد الجايدز اللي مستخدماهم في المشروع
const TOUR_GUIDES_COUNT = 5;

@Component({
  selector: 'app-admin-tour-guides',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tour-guides.html',
  styleUrls: ['../../admin-shared.css','./tour-guides.css'],
})
export class AdminTourGuides {
  searchQuery = '';
  currentPage = 1;
  totalPages = [1, 2, 3, 4, 10];

  guides = [
    { id: 1, name: 'Sarah Malik', email: 'sarah@rv.com', languages: ['English', 'Spanish'], phone: '+20100128346', rating: 4.6, tours: 189, status: 'Active' },
    { id: 2, name: 'Omar Hassan', email: 'omar@rv.com', languages: ['English', 'French'], phone: '+20110128346', rating: 5.0, tours: 245, status: 'Inactive' },
    { id: 3, name: 'Ahmed Nabil', email: 'ahmed@rv.com', languages: ['English', 'Chinese'], phone: '+20120128346', rating: 4.5, tours: 120, status: 'Active' },
    { id: 4, name: 'Youssef Kamal', email: 'youssef@rv.com', languages: ['English', 'Russian'], phone: '+20150128346', rating: 4.3, tours: 210, status: 'Inactive' },
    { id: 5, name: 'Maya Adel', email: 'maya@rv.com', languages: ['English', 'Thai'], phone: '+20102128346', rating: 4.0, tours: 150, status: 'Blocked' },
  ];

  stats = [
    { label: 'Total Tour Guides', value: TOUR_GUIDES_COUNT, icon: '🧭', type: 'total' },
    { label: 'Active', value: this.guides.filter(g => g.status === 'Active').length, icon: '✓', type: 'active' },
    { label: 'Inactive', value: this.guides.filter(g => g.status === 'Inactive').length, icon: '⊘', type: 'inactive' },
    { label: 'Blocked', value: this.guides.filter(g => g.status === 'Blocked').length, icon: '⚠', type: 'blocked' },
  ];

  constructor(private router: Router) {}

  get filtered() {
    if (!this.searchQuery) return this.guides;
    return this.guides.filter(g =>
      g.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  edit(g: any) {
    this.router.navigate(['/admin/tour-guides/manage'], {
      queryParams: { id: g.id },
    });
  }

  delete(g: any) {
    if (confirm(`Delete guide "${g.name}"?`)) {
      this.guides = this.guides.filter(x => x.id !== g.id);

      // 👇 تحديث الستات بعد الحذف
      this.stats[0].value = this.guides.length;
      this.stats[1].value = this.guides.filter(g => g.status === 'Active').length;
      this.stats[2].value = this.guides.filter(g => g.status === 'Inactive').length;
      this.stats[3].value = this.guides.filter(g => g.status === 'Blocked').length;
    }
  }
}