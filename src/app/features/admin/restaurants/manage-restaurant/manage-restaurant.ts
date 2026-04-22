import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../../core/services/resturant.service';
import { Restaurant } from '../../../../core/model/restaurant.model';

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
    stars:       '',
    description: '',
    location:    '',
    address:     '',
    openTime:    '',
    closeTime:   '',
    status:      'Active' as 'Active' | 'Inactive' | 'Blocked',
  };

  constructor(
    private router:   Router,
    private route:    ActivatedRoute,
    private service:  RestaurantService,
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
        stars:       r.stars.toString(),
        description: r.description,
        location:    r.location,
        address:     r.address,
        openTime:    r.openTime,
        closeTime:   r.closeTime,
        status:      (r as any).status ?? 'Active',
      };
    });
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

  removeImage(i: number) {
    this.images.splice(i, 1);
  }

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
          stars:       +this.restaurant.stars,
          description: this.restaurant.description,
          location:    this.restaurant.location,
          address:     this.restaurant.address,
          openTime:    this.restaurant.openTime,
          closeTime:   this.restaurant.closeTime,
          images:      [...this.images],
          status:      this.restaurant.status,
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
        stars:       +this.restaurant.stars,
        description: this.restaurant.description,
        location:    this.restaurant.location,
        address:     this.restaurant.address,
        openTime:    this.restaurant.openTime,
        closeTime:   this.restaurant.closeTime,
        images:      [...this.images],
        amenities:   [],
        status:      this.restaurant.status,
      };
      this.service.addRestaurant(newRestaurant);
      this.showToast('Restaurant added successfully!');
    }
  }

  clear() {
    this.restaurant = {
      name: '', priceRange: '', cuisine: '', rating: '',
      stars: '', description: '', location: '', address: '',
      openTime: '', closeTime: '', status: 'Active',
    };
    this.images = [];
  }
}