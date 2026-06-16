import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';
import { Details } from '../../../TourGuide/details/details';

@Component({
  selector: 'app-admin-tour-guides',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Details],
  templateUrl: './tour-guides.html',
  styleUrls: ['../../admin-shared.css', './tour-guides.css'],
})
export class AdminTourGuides implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 4;

  guides: TourGuide[]             = [];
  selectedGuide: TourGuide | null = null;
  isLoading                       = false;

  deleteToastVisible = false;
  deleteToastMessage = '';
  deleteToastSuccess = true;

  confirmDeleteVisible            = false;
  guideToDelete: TourGuide | null = null;

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
        this.stats[0].value = this.tourGuideService.adminStats.total;
        this.stats[1].value = this.tourGuideService.adminStats.active;
        this.stats[2].value = this.tourGuideService.adminStats.inactive;

        // ✅ بعد ما الداتا اتحملت، تأكد إن currentPage مش فاضية
        this.clampCurrentPage();

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ helper — لو الصفحة الحالية بقت فاضية، ارجع للصفحة اللي قبلها
  private clampCurrentPage(): void {
    const newTotalPages = Math.ceil(this.filteredAll.length / this.pageSize) || 1;
    if (this.currentPage > newTotalPages) {
      this.currentPage = newTotalPages;
    }
  }

  loadStatuses(): void {
    this.tourGuideService.adminGetStatuses().subscribe({
      next: s => { this.availableStatuses = s; },
      error: () => {}
    });
  }

  get filteredAll(): TourGuide[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.guides;
    return this.guides.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.email ?? '').toLowerCase().includes(q)
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

  onSearch(): void { this.currentPage = 1; }

 changeStatus(g: TourGuide, statusId: number): void {
  const statusObj  = this.availableStatuses.find(s => s.id === statusId);
  const statusName = statusObj?.name ?? (g.status === 'Active' ? 'Inactive' : 'Active');

  this.tourGuideService.adminUpdateStatus(g.id, statusName).subscribe({
    next: () => { this.loadGuides(); },
    error: () => {}
  });
}

  view(g: TourGuide)  { this.selectedGuide = g; }
  closeDetails()      { this.selectedGuide = null; }

  edit(g: TourGuide): void {
    this.router.navigate(['/admin/tour-guides/manage'], { queryParams: { id: g.id } });
  }

  delete(g: TourGuide): void {
    this.guideToDelete        = g;
    this.confirmDeleteVisible = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.guideToDelete) return;
    const g = this.guideToDelete;
    this.confirmDeleteVisible = false;
    this.guideToDelete        = null;

    this.tourGuideService.adminDelete(g.id).subscribe({
      next: () => {
        this.loadGuides(); // ✅ clampCurrentPage بتتنادى جواه أوتوماتيك
        this.showDeleteToast(`"${g.name}" deleted successfully.`, true);
      },
      error: (err) => {
        const errors = err?.error?.errors;
        const msg = Array.isArray(errors)
          ? errors.join(' ')
          : (err?.error?.message ?? 'Failed to delete. Please try again.');
        this.showDeleteToast(msg, false);
      }
    });
  }

  cancelDelete(): void {
    this.confirmDeleteVisible = false;
    this.guideToDelete        = null;
    this.cdr.detectChanges();
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
}