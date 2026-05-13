import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { Restaurant, RestaurantTables, Feature } from '../../../../core/model/restaurant.model';

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
  images: string[] = [];

  toastMessage = '';
  toastVisible = false;

  availableFeatures: Feature[] = [];
  selectedFeatureIds: number[] = [];
  featuresDropdownOpen = false;

  restaurant = {
    name:        '',
    minPrice:    0,
    maxPrice:    0,
    cuisine:     '',
    rating:      '',
    description: '',
    location:    '',
    status:      'Active' as 'Active' | 'Inactive' | 'Blocked',
  };

  tables: RestaurantTables = {
    total: 0,
    for2:  0,
    for4:  0,
    for6:  0,
  };

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
      this.restaurant = {
        name:        r.name,
        minPrice:    r.minPrice,
        maxPrice:    r.maxPrice,
        cuisine:     r.cuisine,
        rating:      r.rating.toString(),
        description: r.description,
        location:    r.location,
        status:      (r as any).status ?? 'Active',
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
    if (idx === -1) {
      this.selectedFeatureIds = [...this.selectedFeatureIds, id];
    } else {
      this.selectedFeatureIds = this.selectedFeatureIds.filter(f => f !== id);
    }
  }

  isFeatureSelected(id: number): boolean {
    return this.selectedFeatureIds.includes(id);
  }

  getSelectedFeatureLabels(): string {
    if (this.selectedFeatureIds.length === 0) return 'Select features...';
    return this.availableFeatures
      .filter(f => this.selectedFeatureIds.includes(f.id))
      .map(f => `${f.icon} ${f.name}`)
      .join(', ');
  }

  closeDropdown() {
    this.featuresDropdownOpen = false;
  }

  // ── Tables ───────────────────────────────────────────────

  calcTotal() {
    this.tables.total = this.tables.for2 + this.tables.for4 + this.tables.for6;
  }

  // ── Status ───────────────────────────────────────────────

  setStatus(s: 'Active' | 'Inactive' | 'Blocked') {
    this.restaurant.status = s;
  }

  // ── Images ───────────────────────────────────────────────

  onFileSelected(event: Event) {
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
      if (navigate) this.router.navigate(['/admin/restaurants']);
    }, 1800);
  }

  // ── Save ──────────────────────────────────────────────────

  save() {
    if (!this.restaurant.name || !this.restaurant.minPrice || !this.restaurant.maxPrice) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    const featureIds = [...this.selectedFeatureIds];

    if (this.isEdit && this.restaurantId !== null) {
      this.service.getRestaurantById(this.restaurantId).subscribe(existing => {
        if (!existing) return;
        const updated: Restaurant = {
          ...existing,
          name:        this.restaurant.name,
          minPrice:    +this.restaurant.minPrice,
          maxPrice:    +this.restaurant.maxPrice,
          cuisine:     this.restaurant.cuisine,
          rating:      +this.restaurant.rating,
          description: this.restaurant.description,
          location:    this.restaurant.location,
          images:      [...this.images],
          status:      this.restaurant.status,
          tables:      { ...this.tables },
          featureIds,
        };
        this.service.updateRestaurant(updated);
        this.showToast('Restaurant updated successfully!');
      });

    } else {
      const newRestaurant: Restaurant = {
        id:          Date.now(),
        name:        this.restaurant.name,
        minPrice:    +this.restaurant.minPrice,
        maxPrice:    +this.restaurant.maxPrice,
        cuisine:     this.restaurant.cuisine,
        rating:      +this.restaurant.rating,
        stars:       0,
        description: this.restaurant.description,
        location:    this.restaurant.location,
        openTime:    '',
        closeTime:   '',
        images:      [...this.images],
        amenities:   [],
        status:      this.restaurant.status,
        tables:      { ...this.tables },
        featureIds,
      };
      this.service.addRestaurant(newRestaurant);
      this.showToast('Restaurant added successfully!');
    }
  }

  clear() {
    this.restaurant = {
      name: '', minPrice: 0, maxPrice: 0, cuisine: '', rating: '',
      description: '', location: '', status: 'Active',
    };
    this.tables             = { total: 0, for2: 0, for4: 0, for6: 0 };
    this.selectedFeatureIds = [];
    this.images             = [];
  }
}