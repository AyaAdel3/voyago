import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../../core/services/resturant.service';
import {
  RestaurantTables,
  Feature,
  CuisineType,
  CUISINE_TYPES,
  RESTAURANT_STATUSES,
  AdminRestaurantAddRequest,
  AdminRestaurantUpdateRequest,
  RestaurantDetailApiResponse,
} from '../../../../core/model/restaurant.model';

interface ImageSlot {
  id:  number | null;  // null = صورة جديدة، number = صورة موجودة على السيرفر
  url: string;
}

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

  selectedFiles: File[]      = [];
  images:        ImageSlot[] = [];   // ✅ بقت objects بدل strings

  toastMessage = '';
  toastVisible = false;
  toastSuccess = true;
  isSaving     = false;

  availableFeatures:  Feature[]    = [];
  selectedFeatureIds: number[]     = [];
  featuresDropdownOpen             = false;

  cuisineTypes:      CuisineType[] = CUISINE_TYPES;
  selectedCuisineId: number | null = null;

  statuses         = RESTAURANT_STATUSES;
  selectedStatusId = 1;

  restaurant = {
    name:        '',
    description: '',
    address:     '',
    rating:      '' as string | number,
    minPrice:    0,
    maxPrice:    0,
  };

  tables: RestaurantTables = { total: 0, for2: 0, for4: 0, for6: 0 };

  private token = localStorage.getItem('token') ?? '';

  constructor(
    private router:  Router,
    private cdr:     ChangeDetectorRef,
    private route:   ActivatedRoute,
    private service: RestaurantService,
  ) {}

  ngOnInit() {
    this.service.getFeatures().subscribe(features => {
      this.availableFeatures = features;

      this.route.queryParams.subscribe(params => {
        if (params['id']) {
          this.restaurantId = +params['id'];
          this.isEdit       = true;
          this.loadRestaurant(this.restaurantId);
        }
      });
    });
  }

  // ── Load for Edit ─────────────────────────────────────────
  private loadRestaurant(id: number) {
    this.service['http']
      .get<RestaurantDetailApiResponse>(`http://voyagoo.runasp.net/Restaurants/${id}`)
      .subscribe({
        next: (r: RestaurantDetailApiResponse) => {
          this.restaurant = {
            name:        r.name,
            description: r.description,
            address:     r.address,
            rating:      r.rating,
            minPrice:    r.minPrice,
            maxPrice:    r.maxPrice,
          };

          // cuisineType string → id
          const found = this.cuisineTypes.find(
            c => c.name.toLowerCase() === r.cuisineType.toLowerCase()
          );
          this.selectedCuisineId = found?.id ?? null;

          // features → ids
          this.selectedFeatureIds = r.features ? r.features.map(f => f.id) : [];

          // ✅ images — بنحفظ id + url عشان نقدر نحذف
          this.images = r.images
            ? r.images
                .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                .map(img => ({ id: img.id, url: img.imageUrl }))
            : [];

          // tables
          const for2  = r.tablesForTwo  ?? 0;
          const for4  = r.tablesForFour ?? 0;
          const for6  = r.tablesForSix  ?? 0;
          this.tables = { for2, for4, for6, total: for2 + for4 + for6 };

          this.selectedStatusId = 1;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Failed to load restaurant for edit:', err);
          this.showToast('Failed to load restaurant data.', false, false);
        },
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
        if (e.target?.result) {
          // ✅ id = null للصور الجديدة
          this.images.push({ id: null, url: e.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeImage(i: number) {
    const slot = this.images[i];

    if (slot.id !== null && this.restaurantId !== null) {
      // ✅ صورة موجودة على السيرفر → نكلم DELETE endpoint
      this.service['http']
        .delete<void>(
          `http://voyagoo.runasp.net/admin/restaurants/${this.restaurantId}/images/${slot.id}`,
          { headers: { Authorization: `Bearer ${this.token}` } }
        )
        .subscribe({
          next: () => {
            this.images.splice(i, 1);
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            console.error('Failed to delete image:', err);
            this.showToast('Failed to delete image. Please try again.', false, false);
          },
        });
    } else {
      // صورة جديدة لسه ما اترفعتش → نشيلها من الـ local arrays بس
      const newIndex = this.images.slice(0, i).filter(s => s.id === null).length;
      this.images.splice(i, 1);
      this.selectedFiles.splice(newIndex, 1);
    }
  }

  // ── Toast ─────────────────────────────────────────────────

  showToast(msg: string, navigate = true, success = true) {
    this.toastMessage = msg;
    this.toastSuccess = success;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      if (navigate) this.router.navigate(['/admin/restaurants']);
    }, 1800);
  }

  // ── Validate ──────────────────────────────────────────────

  private validate(): boolean {
    if (!this.restaurant.name.trim()) {
      this.showToast('Restaurant name is required.', false, false); return false;
    }
    if (!this.restaurant.description.trim()) {
      this.showToast('Description is required.', false, false); return false;
    }
    if (!this.restaurant.address.trim()) {
      this.showToast('Address is required.', false, false); return false;
    }
    if (!this.selectedCuisineId) {
      this.showToast('Please select a cuisine type.', false, false); return false;
    }
    if (!this.restaurant.rating) {
      this.showToast('Rating is required.', false, false); return false;
    }
    if (!this.restaurant.minPrice || !this.restaurant.maxPrice) {
      this.showToast('Price range is required.', false, false); return false;
    }
    return true;
  }

  // ── Save ──────────────────────────────────────────────────

  save() {
    if (!this.validate() || this.isSaving) return;
    this.isSaving = true;

    if (this.isEdit && this.restaurantId !== null) {
      this.doUpdate();
    } else {
      this.doAdd();
    }
  }

  private doAdd() {
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

    this.service.addRestaurantApi(body, this.token).subscribe({
      next: (res) => {
        if (this.selectedFiles.length > 0) {
          this.service.uploadRestaurantImages(res.id, this.selectedFiles, this.token).subscribe({
            next:  () => { this.isSaving = false; this.showToast('Restaurant added successfully!'); },
            error: () => { this.isSaving = false; this.showToast('Restaurant added, but images failed to upload.'); },
          });
        } else {
          this.isSaving = false;
          this.showToast('Restaurant added successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Add failed:', err);
        this.showToast('Failed to add restaurant. Please try again.', false, false);
      },
    });
  }

  private doUpdate() {
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

    this.service.updateRestaurantApi(this.restaurantId!, body, this.token).subscribe({
      next: () => {
        if (this.selectedFiles.length > 0) {
          this.service.uploadRestaurantImages(this.restaurantId!, this.selectedFiles, this.token).subscribe({
            next:  () => { this.isSaving = false; this.showToast('Restaurant updated successfully!'); },
            error: () => { this.isSaving = false; this.showToast('Updated, but new images failed to upload.'); },
          });
        } else {
          this.isSaving = false;
          this.showToast('Restaurant updated successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Update failed:', err);
        this.showToast('Failed to update restaurant. Please try again.', false, false);
      },
    });
  }

  clear() {
    this.restaurant         = { name: '', description: '', address: '', rating: '', minPrice: 0, maxPrice: 0 };
    this.tables             = { total: 0, for2: 0, for4: 0, for6: 0 };
    this.selectedFeatureIds = [];
    this.selectedCuisineId  = null;
    this.selectedStatusId   = 1;
    this.images             = [];
    this.selectedFiles      = [];
  }
}