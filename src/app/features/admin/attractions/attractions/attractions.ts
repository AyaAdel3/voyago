import { Component, ChangeDetectorRef } from '@angular/core';
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
export class AdminAttractions {
  searchQuery = '';
  currentPage = 1;
  totalPages = [1, 2, 3, 4, 10];
  deleteToastVisible = false;
  deleteToastMessage = '';
  attractions: Attraction[] = [];

  stats = [
    { label: 'Total Attractions', value: 0, icon: '🗺', type: 'total' },
    { label: 'Active',            value: 0, icon: '✓', type: 'active' },
    { label: 'Inactive',          value: 0, icon: '⊘', type: 'inactive' },
  ];

  constructor(
    private router: Router,
    private attractionService: AttractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadAttractions(); }

  loadAttractions(): void {
    this.attractions = this.attractionService.getAll();
    this.updateStats();
  }

  updateStats(): void {
    this.stats[0].value = this.attractions.length;
    this.stats[1].value = this.attractions.filter(a => a.status === 'Active').length;
    this.stats[2].value = this.attractions.filter(a => a.status === 'Inactive').length;
  }

  get filtered() {
    if (!this.searchQuery) return this.attractions;
    return this.attractions.filter(a =>
      a.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
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
}