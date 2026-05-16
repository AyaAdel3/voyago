import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';

@Component({
  selector: 'app-admin-tour-guides',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tour-guides.html',
  styleUrls: ['../../admin-shared.css', './tour-guides.css'],
})
export class AdminTourGuides implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 4;

  guides: TourGuide[] = [];
  selectedGuide: TourGuide | null = null;
  isLoading = false;

  deleteToastVisible = false;
  deleteToastMessage = '';

  availableStatuses: { id: number; name: string }[] = [];

  stats = [
    { label: 'Total Tour Guides', value: 0, icon: '🧭', type: 'total'    },
    { label: 'Active',            value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',          value: 0, icon: '⊘',  type: 'inactive' },
  ];

  constructor(
    private router: Router,
    private tourGuideService: TourGuideService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadGuides();
    this.loadStatuses();
  }

  loadGuides(): void {
    this.isLoading = true;
    this.tourGuideService.adminGetAll().subscribe({
      next: (data) => {
        this.guides    = data;
        this.isLoading = false;
        this.updateStats();
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadStatuses(): void {
    this.tourGuideService.adminGetStatuses().subscribe({
      next: s => { this.availableStatuses = s; },
      error: () => {}
    });
  }

  updateStats(): void {
    this.stats[0].value = this.guides.length;
    this.stats[1].value = this.guides.filter(g => g.status?.toLowerCase() === 'active').length;
    this.stats[2].value = this.guides.filter(g => g.status?.toLowerCase() === 'inactive').length;
  }

  get filteredAll(): TourGuide[] {
    if (!this.searchQuery.trim()) return this.guides;
    return this.guides.filter(g =>
      g.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filtered(): TourGuide[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  get totalPages(): number[] {
    return Array.from(
      { length: Math.ceil(this.filteredAll.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  changeStatus(g: TourGuide, statusId: number): void {
    this.tourGuideService.adminUpdateStatus(g.id, statusId).subscribe({
      next: () => { this.loadGuides(); },
      error: () => {}
    });
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  showDeleteToast(msg: string) {
    this.deleteToastMessage = msg;
    this.deleteToastVisible = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  view(g: TourGuide)  { this.selectedGuide = g; }
  closeDetails()      { this.selectedGuide = null; }
  edit(g: TourGuide)  { this.router.navigate(['/admin/tour-guides/manage'], { queryParams: { id: g.id } }); }

  delete(g: TourGuide): void {
    this.tourGuideService.adminDelete(g.id).subscribe({
      next: () => {
        this.loadGuides();
        this.showDeleteToast(`"${g.name}" deleted successfully.`);
      },
      error: (err) => {
        const errors = err?.error?.errors;
        const msg = Array.isArray(errors)
          ? errors.join(' ')
          : (err?.error?.message ?? 'Failed to delete.');
        this.showDeleteToast(msg);
      }
    });
  }
}