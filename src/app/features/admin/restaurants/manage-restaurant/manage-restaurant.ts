import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { Restaurant, RestaurantTables } from '../../../../core/model/restaurant.model';

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

  restaurant = {
    name:        '',
    priceRange:  '',
    cuisine:     '',
    rating:      '',
    description: '',
    location:    '',
    address:     '',
    openTime:    '',
    closeTime:   '',
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
        priceRange:  r.priceRange,
        cuisine:     r.cuisine,
        rating:      r.rating.toString(),
        description: r.description,
        location:    r.location,
        address:     r.address,
        openTime:    r.openTime,
        closeTime:   r.closeTime,
        status:      (r as any).status ?? 'Active',
      };
      if (r.tables) {
        this.tables = { ...r.tables };
      }
    });
  }

  calcTotal() {
    this.tables.total = this.tables.for2 + this.tables.for4 + this.tables.for6;
  }

  setStatus(s: 'Active' | 'Inactive' | 'Blocked') {
    this.restaurant.status = s;
  }

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

  showToast(msg: string, navigate = true) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      if (navigate) this.router.navigate(['/admin/restaurants']);
    }, 1800);
  }

  save() {
    if (!this.restaurant.name || !this.restaurant.priceRange) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    if (this.isEdit && this.restaurantId !== null) {
      this.service.getRestaurantById(this.restaurantId).subscribe(existing => {
        if (!existing) return;
        const updated: Restaurant = {
          ...existing,
          name:        this.restaurant.name,
          priceRange:  this.restaurant.priceRange,
          cuisine:     this.restaurant.cuisine,
          rating:      +this.restaurant.rating,
          description: this.restaurant.description,
          location:    this.restaurant.location,
          address:     this.restaurant.address,
          openTime:    this.restaurant.openTime,
          closeTime:   this.restaurant.closeTime,
          images:      [...this.images],
          status:      this.restaurant.status,
          tables:      { ...this.tables },
        };
        this.service.updateRestaurant(updated);
        this.showToast('Restaurant updated successfully!');
      });

    } else {
      const newRestaurant: Restaurant = {
        id:          Date.now(),
        name:        this.restaurant.name,
        priceRange:  this.restaurant.priceRange,
        cuisine:     this.restaurant.cuisine,
        rating:      +this.restaurant.rating,
        stars:       0,
        description: this.restaurant.description,
        location:    this.restaurant.location,
        address:     this.restaurant.address,
        openTime:    this.restaurant.openTime,
        closeTime:   this.restaurant.closeTime,
        images:      [...this.images],
        amenities:   [],
        status:      this.restaurant.status,
        tables:      { ...this.tables },
      };
      this.service.addRestaurant(newRestaurant);
      this.showToast('Restaurant added successfully!');
    }
  }

  clear() {
    this.restaurant = {
      name: '', priceRange: '', cuisine: '', rating: '',
      description: '', location: '', address: '',
      openTime: '', closeTime: '', status: 'Active',
    };
    this.tables  = { total: 0, for2: 0, for4: 0, for6: 0 };
    this.images  = [];
  }
}