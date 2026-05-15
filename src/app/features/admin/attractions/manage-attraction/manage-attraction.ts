import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AttractionService, Attraction, Feature, Category } from '../../../../core/services/attraction.service';

@Component({
  selector: 'app-manage-attraction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-attraction.html',
  styleUrls: ['../../admin-shared.css', './manage-attraction.css'],
})
export class ManageAttraction implements OnInit {
  isEdit = false;
  attractionId: number | null = null;
  images: string[] = [];
  toastMessage = '';
  toastVisible = false;

  // ── Features ─────────────────────────────────────────────
  availableFeatures: Feature[] = [];
  selectedFeatureIds: number[] = [];
  featuresDropdownOpen = false;

  // ── Categories ───────────────────────────────────────────
  availableCategories: Category[] = [];
  selectedCategoryIds: number[] = [];
  categoriesDropdownOpen = false;

  attraction = {
    name: '',
    fee: 0,
    rating: 0,
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    location: '',
    ticketPrice: 0,
    place: '',
    dateOfInscription: 0,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private attractionService: AttractionService
  ) {}

  ngOnInit() {
    this.availableFeatures   = this.attractionService.getFeatures();
    this.availableCategories = this.attractionService.getCategories();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.attractionId = +params['id'];
        this.isEdit = true;
        this.loadAttraction(this.attractionId);
      }
    });
  }

  private loadAttraction(id: number) {
    const found = this.attractionService.getById(id);
    if (!found) return;
    this.images = [...found.images];
    this.attraction = {
      name:              found.name,
      fee:               found.fee,
      rating:            found.rating,
      description:       found.description,
      status:            found.status as 'Active' | 'Inactive',
      location:          found.location,
      ticketPrice:       found.ticketPrice,
      place:             found.place,
      dateOfInscription: found.dateOfInscription,
    };
    if (found.featureIds)  this.selectedFeatureIds  = [...found.featureIds];
    if (found.categoryIds) this.selectedCategoryIds = [...found.categoryIds];
  }

  // ── Features helpers ──────────────────────────────────────
  getFeatureLabel(id: number): string {
    const found = this.availableFeatures.find(f => f.id === id);
    return found ? `${found.icon} ${found.name}` : '';
  }

  toggleFeature(id: number) {
    const idx = this.selectedFeatureIds.indexOf(id);
    if (idx === -1) this.selectedFeatureIds = [...this.selectedFeatureIds, id];
    else            this.selectedFeatureIds = this.selectedFeatureIds.filter(f => f !== id);
  }

  isFeatureSelected(id: number): boolean {
    return this.selectedFeatureIds.includes(id);
  }

  closeFeatureDropdown() { this.featuresDropdownOpen = false; }

  // ── Categories helpers ────────────────────────────────────
  getCategoryLabel(id: number): string {
    const found = this.availableCategories.find(c => c.id === id);
    return found ? `${found.icon} ${found.name}` : '';
  }

  // toggleCategory(id: number) {
  //   const idx = this.selectedCategoryIds.indexOf(id);
  //   if (idx === -1) this.selectedCategoryIds = [...this.selectedCategoryIds, id];
  //   else            this.selectedCategoryIds = this.selectedCategoryIds.filter(c => c !== id);
  // }
  toggleCategory(id: number) {
  if (this.selectedCategoryIds.includes(id)) {
    this.selectedCategoryIds = [];
  } else {
    this.selectedCategoryIds = [id];
  }
}

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  closeCategoryDropdown() { this.categoriesDropdownOpen = false; }

  // ── Status ───────────────────────────────────────────────
  setStatus(s: 'Active' | 'Inactive') { this.attraction.status = s; }

  // ── Images ───────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) this.images.push(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(i: number) { this.images.splice(i, 1); }

  // ── Toast ─────────────────────────────────────────────────
  showToast(msg: string, navigate = true) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      if (navigate) this.router.navigate(['/admin/attractions']);
    }, 1800);
  }

  // ── Save ──────────────────────────────────────────────────
  save() {
    if (!this.attraction.name || !this.selectedCategoryIds.length) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    const data: Omit<Attraction, 'id'> = {
      ...this.attraction,
      images:      [...this.images],
      featureIds:  [...this.selectedFeatureIds],
      categoryIds: [...this.selectedCategoryIds],
    };

    if (this.isEdit && this.attractionId !== null) {
      this.attractionService.update(this.attractionId, data);
      this.showToast('Attraction updated successfully!');
    } else {
      this.attractionService.add(data);
      this.showToast('Attraction added successfully!');
    }
  }

  // ── Clear ─────────────────────────────────────────────────
  clear() {
    this.attraction = {
      name: '', fee: 0, rating: 0, description: '',
      status: 'Active', location: '', ticketPrice: 0,
      place: '', dateOfInscription: 0,
    };
    this.images             = [];
    this.selectedFeatureIds  = [];
    this.selectedCategoryIds = [];
  }
}