import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const STORAGE_KEY = 'voyago_users';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['../../admin-shared.css','./users.css'],
})
export class AdminUsers implements OnInit {
  searchQuery = '';
  currentPage = 1;
  totalPages = [1, 2, 3, 4, 10];

  users: any[] = [];

  stats = [
    { label: 'Total Users', value: 0, icon: '👤', type: 'total' },
    { label: 'Active', value: 0, icon: '✓', type: 'active' },
    { label: 'Inactive', value: 0, icon: '⊘', type: 'inactive' },
    { label: 'Blocked', value: 0, icon: '⚠', type: 'blocked' },
  ];

  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    // 👇 نأمن الـ status لو مش موجود
    this.users = data.map((u: any) => ({
      ...u,
      status: u.status ?? 'Active',
    }));

    this.updateStats();
  }

  updateStats(): void {
    this.stats[0].value = this.users.length;
    this.stats[1].value = this.users.filter(u => u.status === 'Active').length;
    this.stats[2].value = this.users.filter(u => u.status === 'Inactive').length;
    this.stats[3].value = this.users.filter(u => u.status === 'Blocked').length;
  }

  get filtered() {
    if (!this.searchQuery) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  delete(u: any) {
    if (confirm(`Delete user "${u.name}"?`)) {
      this.users = this.users.filter(x => x.id !== u.id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));

      this.updateStats(); // 👈 بدل ما تعيدي الحساب يدوي
    }
  }

  roleClass(role: string) {
    return role === 'admin' ? 'role-admin' : 'role-user';
  }
}