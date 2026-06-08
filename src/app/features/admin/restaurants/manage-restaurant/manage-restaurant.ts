import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../../core/services/resturant.service';
import {
  Restaurant,
  RestaurantTables,
  Feature,
  CuisineType,
  CUISINE_TYPES,
  RESTAURANT_STATUSES,
  AdminRestaurantAddRequest,
  AdminRestaurantUpdateRequest,
} from '../../../../core/model/restaurant.model';

@Component({
  selector: 'app-manage-restaurant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-restaurant.html',
  styleUrls: ['../../admin-shared.css', './manage-restaurant.css'],
})
export class ManageRestaurant implements OnInit {
  isEdit        = false;
  restaurantId: number | null = null;

  // الصور المحددة كـ File objects للرفع
  selectedFiles: File[] = [];
  // روابط الـ preview (base64 للجديدة + URLs للموجودة)
  images: string[] = [];

  toastMessage = '';
  toastVisible = false;
  isSaving     = false;

  availableFeatures: Feature[]     = [];
  selectedFeatureIds: number[]     = [];
  featuresDropdownOpen             = false;

  cuisineTypes: CuisineType[]      = CUISINE_TYPES;
  selectedCuisineId: number | null = null;

  statuses = RESTAURANT_STATUSES;
  selectedStatusId                 = 1; // default: Active

  restaurant = {
    name:        '',
    description: '',
    address:     '',
    rating:      '' as string | number,
    minPrice:    0,
    maxPrice:    0,
  };

  tables: RestaurantTables = { total: 0, for2: 0, for4: 0, for6: 0 };

  constructor(
    private router:  Router,
    private route:   ActivatedRoute,
    private service: RestaurantService,
  ) {}

  ngOnInit() {
    this.service.getFeatures().subscribe(features => {
      this.availableFeatures = features;
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.restaurantId = +params['id'];
        this.isEdit       = true;
        this.loadRestaurant(this.restaurantId);
      }
    });
  }

  private loadRestaurant(id: number) {
    this.service.getRestaurantById(id).subscribe(r => {
      if (!r) return;

      this.images = [...r.images];

      // map cuisine name → id
      const found = this.cuisineTypes.find(c =>
        c.name.toLowerCase() === r.cuisine.toLowerCase()
      );
      this.selectedCuisineId = found?.id ?? null;

      // map status string → id
      const status = (r as any).status ?? 'Active';
      this.selectedStatusId = status === 'Inactive' ? 2 : 1;

      this.restaurant = {
        name:        r.name,
        description: r.description,
        address:     r.location,
        rating:      r.rating,
        minPrice:    r.minPrice,
        maxPrice:    r.maxPrice,
      };

      if (r.tables)     this.tables             = { ...r.tables };
      if (r.featureIds) this.selectedFeatureIds = [...r.featureIds];
    });
  }

  // ── Features helpers ──────────────────────────────────────

  getFeatureLabel(id: number): string {
    const found = this.availableFeatures.find(f => f.id === id);
    return found ? `${found.icon} ${found.name}` : '';
  }

  toggleFeature(id: number) {
    const idx = this.selectedFeatureIds.indexOf(id);
    this.selectedFeatureIds = idx === -1
      ? [...this.selectedFeatureIds, id]
      : this.selectedFeatureIds.filter(f => f !== id);
  }

  isFeatureSelected(id: number): boolean {
    return this.selectedFeatureIds.includes(id);
  }

  closeDropdown() { this.featuresDropdownOpen = false; }

  // ── Tables ───────────────────────────────────────────────

  calcTotal() {
    this.tables.total = this.tables.for2 + this.tables.for4 + this.tables.for6;
  }

  // ── Status ───────────────────────────────────────────────

  setStatus(id: number) { this.selectedStatusId = id; }

  get currentStatusName(): string {
    return this.statuses.find(s => s.id === this.selectedStatusId)?.name ?? 'Active';
  }

  // ── Images ───────────────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) this.images.push(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
    // reset input عشان ينفع تختار نفس الصورة تاني مرة
    input.value = '';
  }

  removeImage(i: number) {
    this.images.splice(i, 1);
    // لو base64 (صورة جديدة) نشيلها من selectedFiles برضو
    if (i < this.selectedFiles.length) {
      this.selectedFiles.splice(i, 1);
    }
  }

  // ── Toast ─────────────────────────────────────────────────

  showToast(msg: string, navigate = true) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      if (navigate) this.router.navigate(['/admin/restaurants']);
    }, 1800);
  }

  // ── Validate ──────────────────────────────────────────────

  private validate(): boolean {
    if (!this.restaurant.name.trim()) {
      this.showToast('Restaurant name is required.', false); return false;
    }
    if (!this.restaurant.description.trim()) {
      this.showToast('Description is required.', false); return false;
    }
    if (!this.restaurant.address.trim()) {
      this.showToast('Address is required.', false); return false;
    }
    if (!this.selectedCuisineId) {
      this.showToast('Please select a cuisine type.', false); return false;
    }
    if (!this.restaurant.rating) {
      this.showToast('Rating is required.', false); return false;
    }
    if (!this.restaurant.minPrice || !this.restaurant.maxPrice) {
      this.showToast('Price range is required.', false); return false;
    }
    return true;
  }

  // ── Save ──────────────────────────────────────────────────

  save() {
    if (!this.validate() || this.isSaving) return;

    const token = localStorage.getItem('token') ?? '';
    this.isSaving = true;

    if (this.isEdit && this.restaurantId !== null) {
      this.doUpdate(token);
    } else {
      this.doAdd(token);
    }
  }

  private doAdd(token: string) {
    const body: AdminRestaurantAddRequest = {
      name:          this.restaurant.name.trim(),
      description:   this.restaurant.description.trim(),
      address:       this.restaurant.address.trim(),
      rating:        +this.restaurant.rating,
      cuisineType:   this.selectedCuisineId!,
      minPrice:      +this.restaurant.minPrice,
      maxPrice:      +this.restaurant.maxPrice,
      tablesForTwo:  this.tables.for2,
      tablesForFour: this.tables.for4,
      tablesForSix:  this.tables.for6,
      featureIds:    [...this.selectedFeatureIds],
    };

    this.service.addRestaurantApi(body, token).subscribe({
      next: (res) => {
        // لو في صور، ارفعها على الـ id الجديد
        if (this.selectedFiles.length > 0) {
          this.service.uploadRestaurantImages(res.id, this.selectedFiles, token).subscribe({
            next: () => {
              this.isSaving = false;
              this.showToast('Restaurant added successfully!');
            },
            error: () => {
              this.isSaving = false;
              // الـ restaurant اتضاف بس الصور فشلوا
              this.showToast('Restaurant added, but images failed to upload.');
            },
          });
        } else {
          this.isSaving = false;
          this.showToast('Restaurant added successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Add failed:', err);
        this.showToast('Failed to add restaurant. Please try again.', false);
      },
    });
  }

  private doUpdate(token: string) {
    const body: AdminRestaurantUpdateRequest = {
      name:          this.restaurant.name.trim(),
      description:   this.restaurant.description.trim(),
      address:       this.restaurant.address.trim(),
      rating:        +this.restaurant.rating,
      cuisineType:   this.selectedCuisineId!,
      minPrice:      +this.restaurant.minPrice,
      maxPrice:      +this.restaurant.maxPrice,
      tablesForTwo:  this.tables.for2,
      tablesForFour: this.tables.for4,
      tablesForSix:  this.tables.for6,
      status:        this.selectedStatusId,
      featureIds:    [...this.selectedFeatureIds],
    };

    this.service.updateRestaurantApi(this.restaurantId!, body, token).subscribe({
      next: () => {
        // لو في صور جديدة، ارفعها
        if (this.selectedFiles.length > 0) {
          this.service.uploadRestaurantImages(this.restaurantId!, this.selectedFiles, token).subscribe({
            next: () => {
              this.isSaving = false;
              this.showToast('Restaurant updated successfully!');
            },
            error: () => {
              this.isSaving = false;
              this.showToast('Updated, but new images failed to upload.');
            },
          });
        } else {
          this.isSaving = false;
          this.showToast('Restaurant updated successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Update failed:', err);
        this.showToast('Failed to update restaurant. Please try again.', false);
      },
    });
  }

  clear() {
    this.restaurant     = { name: '', description: '', address: '', rating: '', minPrice: 0, maxPrice: 0 };
    this.tables         = { total: 0, for2: 0, for4: 0, for6: 0 };
    this.selectedFeatureIds = [];
    this.selectedCuisineId  = null;
    this.selectedStatusId   = 1;
    this.images             = [];
    this.selectedFiles      = [];
  }
}