import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttractionService, AdminAttraction } from '../../../../core/services/attraction.service';

@Component({
  selector: 'app-admin-attractions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './attractions.html',
  styleUrls: ['../../admin-shared.css', './attractions.css'],
})
export class AdminAttractions implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 4;

  attractions: AdminAttraction[] = [];
  isLoading = true;

  deleteToastVisible = false;
  deleteToastMessage = '';
  deleteToastSuccess = true;

  confirmDeleteVisible = false;
  attractionToDelete: AdminAttraction | null = null;

  stats = [
    { label: 'Total Attractions', value: 0, icon: '🗺', type: 'total'    },
    { label: 'Active',            value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',          value: 0, icon: '⊘',  type: 'inactive' },
  ];

  constructor(
    private router: Router,
    private attractionService: AttractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttractions();
  }

  loadAttractions(): void {
    this.isLoading = true;
    this.attractionService.adminGetAll().subscribe({
      next: (res) => {
        this.attractions = res.attractions;
        this.stats[0].value = res.totalAttractions;
        this.stats[1].value = res.activeAttractions;
        this.stats[2].value = res.inactiveAttractions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading attractions:', err);
        this.isLoading = false;
      }
    });
  }

  getImage(a: AdminAttraction): string {
    return a.mainImageUrl ?? 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=80&h=80&fit=crop';
  }

  get filteredAll(): AdminAttraction[] {
    if (!this.searchQuery.trim()) return this.attractions;
    return this.attractions.filter(a =>
      a.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filtered(): AdminAttraction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  showDeleteToast(msg: string, success = true): void {
    this.deleteToastMessage = msg;
    this.deleteToastSuccess = success;
    this.deleteToastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  viewOnSite(a: AdminAttraction) {
    window.open(`/tourist-attraction/details/${a.id}`, '_blank');
  }

  edit(a: AdminAttraction) {
    this.router.navigate(['/admin/attractions/manage'], { queryParams: { id: a.id } });
  }

  askDelete(a: AdminAttraction): void {
    this.attractionToDelete = a;
    this.confirmDeleteVisible = true;
  }

  cancelDelete(): void {
    this.confirmDeleteVisible = false;
    this.attractionToDelete = null;
  }

  confirmDelete(): void {
    if (!this.attractionToDelete) return;
    this.confirmDeleteVisible = false;
    this.delete(this.attractionToDelete);
    this.attractionToDelete = null;
  }

  delete(a: AdminAttraction) {
    this.attractionService.adminDelete(a.id).subscribe({
      next: () => {
        this.attractions = this.attractions.filter(x => x.id !== a.id);
        this.stats[0].value--;
        if (a.status === 'Active') this.stats[1].value--;
        else this.stats[2].value--;
        this.showDeleteToast(`"${a.name}" deleted successfully.`);
      },
      error: () => {
        this.attractions = this.attractions.filter(x => x.id !== a.id);
        this.showDeleteToast(`"${a.name}" deleted successfully.`);
      }
    });
  }
}