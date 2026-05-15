import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';
import { Details } from '../../../../features/TourGuide/details/details';

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

  guides: TourGuide[] = [];
  selectedGuide: TourGuide | null = null;

  deleteToastVisible = false;
  deleteToastMessage = '';

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

  ngOnInit(): void { this.loadGuides(); }

  loadGuides(): void {
    this.guides = this.tourGuideService.getAll();
    this.updateStats();
  }

  updateStats(): void {
    this.stats[0].value = this.guides.length;
    this.stats[1].value = this.guides.filter(g => g.status === 'Active').length;
    this.stats[2].value = this.guides.filter(g => g.status === 'Inactive').length;
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

  onSearch(): void {
    this.currentPage = 1;
  }

  showDeleteToast(msg: string) {
    this.deleteToastMessage = msg;
    this.deleteToastVisible = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 6000);
  }

  view(g: TourGuide) { this.selectedGuide = g; }
  closeDetails() { this.selectedGuide = null; }

  edit(g: TourGuide) {
    this.router.navigate(['/admin/tour-guides/manage'], { queryParams: { id: g.id } });
  }

  delete(g: TourGuide) {
    this.tourGuideService.delete(g.id);
    this.loadGuides();
    this.showDeleteToast(`"${g.name}" deleted successfully.`);
  }
}