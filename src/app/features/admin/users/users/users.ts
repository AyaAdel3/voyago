import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['../../admin-shared.css', './users.css'],
})
export class AdminUsers implements OnInit {
  searchQuery = '';
  currentPage = 1;
  pageSize = 10;

  users: any[] = [];

  stats = [
    { label: 'Total Users', value: 0, icon: '👤', type: 'total' },
    { label: 'Active', value: 0, icon: '✓', type: 'active' },
    { label: 'Inactive', value: 0, icon: '⊘', type: 'inactive' },
  ];

  ngOnInit(): void {
    this.users = [
      { id: 1, name: 'Ahmed Mohamed', email: 'ahmed@voyago.com', status: 'Active' },
      { id: 2, name: 'Sara Ali',      email: 'sara@voyago.com',  status: 'Inactive' },
      { id: 3, name: 'Omar Hassan',   email: 'omar@voyago.com',  status: 'Active' },
      { id: 4, name: 'Nour Khaled',   email: 'nour@voyago.com',  status: 'Inactive' },
      { id: 5, name: 'Mona Tarek',    email: 'mona@voyago.com',  status: 'Active' },
    ];
    this.updateStats();
  }

  updateStats(): void {
    this.stats[0].value = this.users.length;
    this.stats[1].value = this.users.filter(u => u.status === 'Active').length;
    this.stats[2].value = this.users.filter(u => u.status === 'Inactive').length;
  }

  get filtered() {
    const list = this.searchQuery
      ? this.users.filter(u =>
          u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.users;

    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    const list = this.searchQuery
      ? this.users.filter(u =>
          u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.users;

    const count = Math.ceil(list.length / this.pageSize);
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  toggleStatus(u: any): void {
    u.status = u.status === 'Active' ? 'Inactive' : 'Active';
    this.updateStats();
  }
}