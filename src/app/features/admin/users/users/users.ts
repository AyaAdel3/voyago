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

  get filteredAll(): any[] {
    if (!this.searchQuery.trim()) return this.users;
    return this.users.filter(u =>
      u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filtered(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) || 1 },
      (_, i) => i + 1
    );
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  goToPage(p: number): void { this.currentPage = p; }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages.length) this.currentPage++;
  }

  toggleStatus(u: any): void {
    u.status = u.status === 'Active' ? 'Inactive' : 'Active';
    this.updateStats();

    // ✅ لو الصفحة الحالية بقت فاضية، ارجع للصفحة اللي قبلها
    const newTotalPages = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
    if (this.currentPage > newTotalPages) {
      this.currentPage = newTotalPages;
    }
  }
}