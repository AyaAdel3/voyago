import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttractionService, Attraction } from '../../../../core/services/attraction.service';

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

  attractions: Attraction[] = [];

  deleteToastVisible = false;
  deleteToastMessage = '';

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
    this.attractions = this.attractionService.getAll();
    this.updateStats();
  }

  updateStats(): void {
    this.stats[0].value = this.attractions.length;
    this.stats[1].value = this.attractions.filter(a => a.status === 'Active').length;
    this.stats[2].value = this.attractions.filter(a => a.status === 'Inactive').length;
  }

  // كل البيانات المفلترة بدون pagination
  get filteredAll(): Attraction[] {
    if (!this.searchQuery.trim()) return this.attractions;
    return this.attractions.filter(a =>
      a.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // الصفحة الحالية فقط
  get filtered(): Attraction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAll.slice(start, start + this.pageSize);
  }

  // عدد الصفحات
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

  viewOnSite(a: Attraction) {
    window.open(`/tourist-attraction/details/${a.id}`, '_blank');
  }

  edit(a: Attraction) {
    this.router.navigate(['/admin/attractions/manage'], { queryParams: { id: a.id } });
  }

  delete(a: Attraction) {
    this.attractionService.delete(a.id);
    this.loadAttractions();
    this.showDeleteToast(`"${a.name}" deleted successfully.`);
  }


  getCategoryLabels(ids: number[] = []): string {
  return ids
    .map(id => this.attractionService.getCategories().find(c => c.id === id)?.name ?? '')
    .filter(Boolean)
    .join(', ');
}

}