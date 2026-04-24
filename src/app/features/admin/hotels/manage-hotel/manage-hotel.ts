import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HotelService } from '../../../../core/services/hotel.service';
import { Hotel, HotelRooms } from '../../../../core/model/hotel.model';

@Component({
  selector: 'app-manage-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-hotel.html',
  styleUrls: ['../../admin-shared.css', './manage-hotel.css'],
})
export class ManageHotel implements OnInit {
  isEdit    = false;
  hotelId: number | null = null;
  images: string[] = [];

  toastMessage = '';
  toastVisible = false;

  hotel = {
    name:          '',
    pricePerNight: '',
    rating:        '',
    description:   '',
    location:      '',
    status:        'Active' as 'Active' | 'Inactive' | 'Blocked',
  };

  rooms: HotelRooms = {
    total:  0,
    single: 0,
    double: 0,
    triple: 0,
    suite:  0,
  };

  constructor(
    private router: Router,
    private route:  ActivatedRoute,
    private hotelService: HotelService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.hotelId = +params['id'];
        this.isEdit  = true;
        this.loadHotel(this.hotelId);
      }
    });
  }

  private loadHotel(id: number) {
    this.hotelService.getHotelById(id).subscribe(h => {
      if (!h) return;
      this.images = [...h.images];
      this.hotel  = {
        name:          h.name,
        pricePerNight: h.pricePerNight.toString(),
        rating:        h.rating.toString(),
        description:   h.description,
        location:      h.location,
        status:        (h as any).status ?? 'Active',
      };
      if (h.rooms) {
        this.rooms = { ...h.rooms };
      }
    });
  }

  // حساب التوتال تلقائي من باقي الأنواع
  calcTotal() {
    this.rooms.total = this.rooms.single + this.rooms.double + this.rooms.triple + this.rooms.suite;
  }

  setStatus(s: 'Active' | 'Inactive' | 'Blocked') {
    this.hotel.status = s;
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
      if (navigate) this.router.navigate(['/admin/hotels']);
    }, 1800);
  }

  save() {
    if (!this.hotel.name || !this.hotel.pricePerNight) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    if (this.isEdit && this.hotelId !== null) {
      this.hotelService.getHotelById(this.hotelId).subscribe(existing => {
        if (!existing) return;
        const updated: Hotel = {
          ...existing,
          name:          this.hotel.name,
          pricePerNight: +this.hotel.pricePerNight,
          rating:        +this.hotel.rating,
          description:   this.hotel.description,
          location:      this.hotel.location,
          images:        [...this.images],
          status:        this.hotel.status,
          rooms:         { ...this.rooms },
        } as Hotel;

        this.hotelService.updateHotel(updated);
        this.showToast('Hotel updated successfully!');
      });

    } else {
      const newHotel = {
        id:            Date.now(),
        name:          this.hotel.name,
        pricePerNight: +this.hotel.pricePerNight,
        stars:         0,
        rating:        +this.hotel.rating,
        description:   this.hotel.description,
        location:      this.hotel.location,
        images:        [...this.images],
        amenities:     [],
        status:        this.hotel.status,
        rooms:         { ...this.rooms },
      } as unknown as Hotel;

      this.hotelService.addHotel(newHotel);
      this.showToast('Hotel added successfully!');
    }
  }

  clear() {
    this.hotel = {
      name: '', pricePerNight: '', rating: '',
      description: '', location: '', status: 'Active',
    };
    this.rooms  = { total: 0, single: 0, double: 0, triple: 0, suite: 0 };
    this.images = [];
  }
}