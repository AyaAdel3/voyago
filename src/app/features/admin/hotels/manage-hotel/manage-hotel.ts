import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HotelService } from '../../../../core/services/hotel.service';
import {
  Hotel, HotelRooms, HotelDisplayFeature, HotelRoomPrices,
  BookingFeatureDef, FIXED_BOOKING_FEATURES, FIXED_BOOKING_FEATURE_NAMES,
  HotelFeatureDef, MOCK_DISPLAY_FEATURES, MOCK_HOTEL_FEATURES,
} from '../../../../core/model/hotel.model';

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
    name:             '',
    rating:           '',
    description:      '',
    location:         '',
    status:           'Active' as 'Active' | 'Inactive' | 'Blocked',
    discount:         0,
    serviceChargePct: 5,
  };

  roomPrices: HotelRoomPrices = {
    standard: 0,
    double:   0,
    triple:   0,
    suite:    0,
  };

  rooms: HotelRooms = { total: 0, single: 0, double: 0, triple: 0, suite: 0 };

  // ── Display Features (Great for your stay) ────────────────
  availableDisplayFeatures: HotelFeatureDef[] = MOCK_DISPLAY_FEATURES;
  selectedDisplayFeatureIds: number[] = [];
  displayDropdownOpen = false;

  // ── Booking Features ──────────────────────────────────────
  fixedBookingFeatures: BookingFeatureDef[] = FIXED_BOOKING_FEATURE_NAMES.map(name => ({ name, price: 0 }));
  extraBookingFeatures: BookingFeatureDef[] = [];

  newFeatureName  = '';
  newFeaturePrice = '';
  bookingDropdownOpen = false;

  constructor(
    private router:       Router,
    private route:        ActivatedRoute,
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
        name:             h.name,
        rating:           h.rating.toString(),
        description:      h.description,
        location:         h.location,
        status:           (h as any).status ?? 'Active',
        discount:         (h as any).discount ?? 0,
        serviceChargePct: (h as any).serviceChargePct ?? 5,
      };
      if (h.rooms) this.rooms = { ...h.rooms };

      if (h.roomPrices) {
        this.roomPrices = { ...h.roomPrices };
      } else {
        this.roomPrices = {
          standard: h.pricePerNight,
          double:   Math.round(h.pricePerNight * 1.5),
          triple:   Math.round(h.pricePerNight * 1.8),
          suite:    h.pricePerNight * 5,
        };
      }

      this.selectedDisplayFeatureIds = h.displayFeatureIds
        ? [...h.displayFeatureIds]
        : [];

      const hotelBookingFeatures = h.bookingFeatures ?? [];
      this.fixedBookingFeatures = FIXED_BOOKING_FEATURE_NAMES.map(name => {
        const found = hotelBookingFeatures.find(f => f.name === name);
        return found ? { ...found } : { name, price: 0 };
      });

      this.extraBookingFeatures = hotelBookingFeatures
        .filter(f => !FIXED_BOOKING_FEATURE_NAMES.includes(f.name))
        .map(f => ({ ...f }));
    });
  }

  // ── Rooms ─────────────────────────────────────────────────

  calcTotal() {
    this.rooms.total = this.rooms.single + this.rooms.double + this.rooms.triple + this.rooms.suite;
  }

  // ── Status ────────────────────────────────────────────────

  setStatus(s: 'Active' | 'Inactive' | 'Blocked') {
    this.hotel.status = s;
  }

  // ── Display Features helpers ──────────────────────────────

  getDisplayFeatureLabel(id: number): string {
    const f = this.availableDisplayFeatures.find(f => f.id === id);
    return f ? `${f.icon} ${f.name}` : '';
  }

  toggleDisplayFeature(id: number) {
    const idx = this.selectedDisplayFeatureIds.indexOf(id);
    if (idx === -1) {
      this.selectedDisplayFeatureIds = [...this.selectedDisplayFeatureIds, id];
    } else {
      this.selectedDisplayFeatureIds = this.selectedDisplayFeatureIds.filter(i => i !== id);
    }
  }

  isDisplayFeatureSelected(id: number): boolean {
    return this.selectedDisplayFeatureIds.includes(id);
  }

  closeDisplayDropdown() {
    this.displayDropdownOpen = false;
  }

  // ── Booking Features helpers ──────────────────────────────

  get availableBookingFeatures(): HotelFeatureDef[] {
    const usedNames = [
      ...FIXED_BOOKING_FEATURE_NAMES.map(n => n.toLowerCase()),
      ...this.extraBookingFeatures.map(f => f.name.toLowerCase()),
    ];
    return MOCK_HOTEL_FEATURES.filter(f => !usedNames.includes(f.name.toLowerCase()));
  }

  selectBookingFeature(name: string) {
    this.newFeatureName = name;
    this.bookingDropdownOpen = false;
  }

  addBookingFeature() {
    const name  = this.newFeatureName.trim();
    const price = parseFloat(this.newFeaturePrice);
    if (!name || isNaN(price) || price < 0) return;

    const allNames = [
      ...FIXED_BOOKING_FEATURE_NAMES.map(n => n.toLowerCase()),
      ...this.extraBookingFeatures.map(f => f.name.toLowerCase()),
    ];
    if (allNames.includes(name.toLowerCase())) return;

    this.extraBookingFeatures = [...this.extraBookingFeatures, { name, price }];
    this.newFeatureName       = '';
    this.newFeaturePrice      = '';
    this.bookingDropdownOpen  = false;
  }

  removeExtraBookingFeature(i: number) {
    this.extraBookingFeatures = this.extraBookingFeatures.filter((_, idx) => idx !== i);
  }

  // ── Images ────────────────────────────────────────────────

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
      if (navigate) this.router.navigate(['/admin/hotels']);
    }, 1800);
  }

  // ── Save ──────────────────────────────────────────────────

  save() {
    if (!this.hotel.name || !this.roomPrices.standard) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    const discount         = Math.min(100, Math.max(0, this.hotel.discount         ?? 0));
    const serviceChargePct = Math.min(100, Math.max(0, this.hotel.serviceChargePct ?? 0));

    const displayFeatures: HotelDisplayFeature[] = this.availableDisplayFeatures
      .filter(f => this.selectedDisplayFeatureIds.includes(f.id))
      .map(f => ({ icon: f.icon, name: f.name }));

    const bookingFeatures: BookingFeatureDef[] = [
      ...this.fixedBookingFeatures,
      ...this.extraBookingFeatures,
    ];

    const pricePerNight = this.roomPrices.standard;

    if (this.isEdit && this.hotelId !== null) {
      this.hotelService.getHotelById(this.hotelId).subscribe(existing => {
        if (!existing) return;
        const updated: Hotel = {
          ...existing,
          name:               this.hotel.name,
          pricePerNight,
          roomPrices:         { ...this.roomPrices },
          rating:             +this.hotel.rating,
          description:        this.hotel.description,
          location:           this.hotel.location,
          images:             [...this.images],
          status:             this.hotel.status,
          discount,
          serviceChargePct,
          rooms:              { ...this.rooms },
          displayFeatureIds:  [...this.selectedDisplayFeatureIds],
          displayFeatures,
          bookingFeatures,
        };
        this.hotelService.updateHotel(updated);
        this.showToast('Hotel updated successfully!');
      });

    } else {
      const newHotel: Hotel = {
        id:                Date.now(),
        name:              this.hotel.name,
        pricePerNight,
        roomPrices:        { ...this.roomPrices },
        stars:             0,
        rating:            +this.hotel.rating,
        description:       this.hotel.description,
        location:          this.hotel.location,
        images:            [...this.images],
        amenities:         [],
        status:            this.hotel.status,
        discount,
        serviceChargePct,
        rooms:             { ...this.rooms },
        displayFeatureIds: [...this.selectedDisplayFeatureIds],
        displayFeatures,
        bookingFeatures,
      };
      this.hotelService.addHotel(newHotel);
      this.showToast('Hotel added successfully!');
    }
  }

  clear() {
    this.hotel = {
      name: '', rating: '',
      description: '', location: '', status: 'Active',
      discount: 0, serviceChargePct: 5,
    };
    this.roomPrices                = { standard: 0, double: 0, triple: 0, suite: 0 };
    this.rooms                     = { total: 0, single: 0, double: 0, triple: 0, suite: 0 };
    this.images                    = [];
    this.selectedDisplayFeatureIds = [];
    this.fixedBookingFeatures      = FIXED_BOOKING_FEATURE_NAMES.map(name => ({ name, price: 0 }));
    this.extraBookingFeatures      = [];
    this.newFeatureName            = '';
    this.newFeaturePrice           = '';
    this.bookingDropdownOpen       = false;
  }
}