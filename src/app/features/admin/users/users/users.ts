import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

interface ApiUsersResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  users: ApiUser[];
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['../../admin-shared.css', './users.css'],
})
export class AdminUsers implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  private readonly API_BASE = environment.apiUrl;

  users: User[] = [];
  isLoading = false;
  errorMsg  = '';

  searchQuery = '';
  currentPage = 1;
  pageSize    = 10;

  stats = [
    { label: 'Total Users', value: 0, icon: '👤', type: 'total'    },
    { label: 'Active',      value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',    value: 0, icon: '⊘',  type: 'inactive' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMsg  = '';

    this.http
      .get<ApiUsersResponse>(`${this.API_BASE}/admin/users`)
      .pipe(
        catchError(err => {
          this.errorMsg = err?.error?.message ?? 'Failed to load users. Please try again.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: res => {
          if (!res) return;

          this.stats[0].value = res.totalUsers;
          this.stats[1].value = res.activeUsers;
          this.stats[2].value = res.inactiveUsers;

          this.users = res.users.map(u => ({
            id:     u.id,
            name:   u.fullName,
            email:  u.email,
            phone:  u.phoneNumber,
            status: u.isActive ? 'Active' : 'Inactive',
          }));

          this.currentPage = 1;
          this.clampPage();

          console.log('Users Loaded:', this.users);
          this.cdr.detectChanges();
        },
        error: () => { this.cdr.detectChanges(); }
      });
  }

  // ✅ FIX: endpoint corrected to /toggle-status
  toggleStatus(u: User): void {
    const prev     = u.status;
    const isActive = u.status !== 'Active';

    // Optimistic update
    u.status = isActive ? 'Active' : 'Inactive';
    this.recalcStats();
    this.clampPage();

    this.http
      .patch(`${this.API_BASE}/admin/users/${u.id}/toggle-status`, { isActive })
      .pipe(
        catchError(err => {
          // Roll back on failure
          u.status = prev;
          this.recalcStats();
          this.errorMsg = err?.error?.message ?? 'Failed to update user status.';
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe(() => { this.cdr.detectChanges(); });
  }

  private recalcStats(): void {
    this.stats[0].value = this.users.length;
    this.stats[1].value = this.users.filter(u => u.status === 'Active').length;
    this.stats[2].value = this.users.filter(u => u.status === 'Inactive').length;
  }

  get filteredAll(): User[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  get filtered(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    const count = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  onSearch():           void { this.currentPage = 1; }
  goToPage(p: number):  void { this.currentPage = p; }
  prevPage():           void { if (this.currentPage > 1)                     this.currentPage--; }
  nextPage():           void { if (this.currentPage < this.totalPages.length) this.currentPage++; }

  private clampPage(): void {
    const max = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
    if (this.currentPage > max) this.currentPage = max;
  }
}