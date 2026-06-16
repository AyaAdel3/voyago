import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HotelService } from '../../../../core/services/hotel.service';
import {
  HotelRooms, HotelRoomPrices,
  HotelFeatureDef,
  AdminAddHotelRequest, AdminBookingFeaturePayload,
  BookingFeatureApiItem,
  FULL_BOARD_API_ID, HALF_BOARD_API_ID,
} from '../../../../core/model/hotel.model';

interface BookingFeatureRow {
  apiId:  number;
  name:   string;
  icon:   string;
  price:  number;
}

interface ImageSlot {
  id:  number | null;
  url: string;
}

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

  images:        ImageSlot[] = [];
  selectedFiles: File[]      = [];

  toastMessage  = '';
  toastVisible  = false;
  toastSuccess  = true;
  isSaving      = false;
  isLoadingData = false;

  hotel = {
    name:             '',
    rating:           '' as string | number,
    description:      '',
    location:         '',
    status:           'Active' as 'Active' | 'Inactive' | 'Blocked',
    discount:         0,
    serviceChargePct: 0,
  };

  roomPrices: HotelRoomPrices = { standard: 0, double: 0, triple: 0, suite: 0 };
  rooms: HotelRooms           = { total: 0, single: 0, double: 0, triple: 0, suite: 0 };

  availableDisplayFeatures: HotelFeatureDef[] = [];
  featuresLoading = false;
  featuresError   = false;
  selectedDisplayFeatureIds: number[] = [];
  displayDropdownOpen = false;

  fullBoardPrice = 0;
  halfBoardPrice = 0;

  availableBookingFeatures: BookingFeatureApiItem[] = [];
  bookingFeaturesLoading = false;
  bookingFeaturesError   = false;
  extraBookingFeatures: BookingFeatureRow[] = [];
  selectedBookingFeatureId: number | null = null;
  newBookingFeaturePrice = 0;
  bookingDropdownOpen    = false;

  // ── Auth token — tries all common storage keys ──────────
  private get authToken(): string {
    return localStorage.getItem('token')
      ?? localStorage.getItem('authToken')
      ?? localStorage.getItem('access_token')
      ?? sessionStorage.getItem('token')
      ?? sessionStorage.getItem('authToken')
      ?? '';
  }

  constructor(
    private router:       Router,
    private route:        ActivatedRoute,
    private hotelService: HotelService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const token = this.authToken;

    // ── Set isEdit & hotelId IMMEDIATELY from URL ──────────
    // This makes the title show "Manage" right away, before any API call
    const params = this.route.snapshot.queryParams;
    if (params['id']) {
      this.hotelId = +params['id'];
      this.isEdit  = true;
    }

    this.featuresLoading        = true;
    this.bookingFeaturesLoading = true;

    // Load both feature lists first, then load hotel data (for edit)
    forkJoin({
      displayFeatures: this.hotelService.getHotelFeaturesFromApi(token),
      bookingFeatures: this.hotelService.getBookingFeaturesFromApi(token),
    }).subscribe({
      next: ({ displayFeatures, bookingFeatures }) => {
        this.availableDisplayFeatures = displayFeatures;
        this.featuresLoading          = false;

        this.availableBookingFeatures = bookingFeatures.filter(
          f => f.id !== FULL_BOARD_API_ID && f.id !== HALF_BOARD_API_ID
        );
        this.bookingFeaturesLoading = false;
        this.cdr.detectChanges();

        // Load hotel data after feature lists are ready
        this.route.queryParams.subscribe(params => {
          if (params['id']) {
            this.hotelId = +params['id'];
            this.isEdit  = true;
            this.loadHotel(this.hotelId);
          }
        });
      },
      error: () => {
        this.featuresLoading        = false;
        this.bookingFeaturesLoading = false;
        this.featuresError          = true;
        this.bookingFeaturesError   = true;
        this.cdr.detectChanges();

        this.route.queryParams.subscribe(params => {
          if (params['id']) {
            this.hotelId = +params['id'];
            this.isEdit  = true;
            this.loadHotel(this.hotelId);
          }
        });
      },
    });
  }

  // ── GET /admin/hotels/{id} ─────────────────────────────────
  private loadHotel(id: number) {
    this.isLoadingData = true;
    const token = this.authToken;

    this.hotelService.getAdminHotelById(id, token).subscribe({
      next: (h: any) => {

        // ── Basic info ──────────────────────────────────────
        this.hotel = {
          name:             h.name          ?? '',
          rating:           h.rating        ?? '',
          description:      h.description   ?? '',
          location:         h.location      ?? '',
          status:           h.status        ?? 'Active',
          discount:         h.discount      ?? 0,
          serviceChargePct: h.serviceCharge ?? 0,  // API returns "serviceCharge"
        };

        // ── Rooms count ─────────────────────────────────────
        this.rooms = {
          single: h.singleRooms ?? 0,
          double: h.doubleRooms ?? 0,
          triple: h.tripleRooms ?? 0,
          suite:  h.suiteRooms  ?? 0,
          total: (h.singleRooms ?? 0) + (h.doubleRooms ?? 0)
               + (h.tripleRooms ?? 0) + (h.suiteRooms  ?? 0),
        };

        // ── Room prices ─────────────────────────────────────
        this.roomPrices = {
          standard: h.singlePrice ?? 0,
          double:   h.doublePrice ?? 0,
          triple:   h.triplePrice ?? 0,
          suite:    h.suitePrice  ?? 0,
        };

        // ── Display features ────────────────────────────────
        // API returns: features: [{ id, name, icon }]
        this.selectedDisplayFeatureIds = Array.isArray(h.features)
          ? h.features.map((f: any) => f.id)
          : [];

        // ── Booking features ────────────────────────────────
        // API returns: bookingFeatures: [{ id, name, icon, price, isFixed }]
        // isFixed=true  → Full Board (1001) / Half Board (1002)
        // isFixed=false → extra features chosen by admin

        const allBooking: any[] = h.bookingFeatures ?? [];

        // Fixed: extract fullBoardPrice & halfBoardPrice
        const fullBoard = allBooking.find((f: any) => f.id === FULL_BOARD_API_ID || f.isFixed && f.name?.toLowerCase().includes('full'));
        const halfBoard = allBooking.find((f: any) => f.id === HALF_BOARD_API_ID || f.isFixed && f.name?.toLowerCase().includes('half'));
        this.fullBoardPrice = fullBoard?.price ?? 0;
        this.halfBoardPrice = halfBoard?.price ?? 0;

        // Extras: isFixed=false only
        this.extraBookingFeatures = allBooking
          .filter((f: any) => !f.isFixed)
          .map((f: any) => {
            const match = this.availableBookingFeatures.find(af => af.id === f.id);
            return {
              apiId: f.id,
              name:  f.name  ?? match?.name ?? '',
              icon:  f.icon  ?? match?.icon ?? '⭐',
              price: f.price ?? 0,
            };
          });

        // ── Images ──────────────────────────────────────────
        // API returns: images: [{ id, imageUrl, isMain }]
        this.images = Array.isArray(h.images) && h.images.length > 0
          ? h.images
              .sort((a: any, b: any) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
              .map((img: any) => ({
                id:  img.id       ?? null,
                url: img.imageUrl ?? '',
              }))
              .filter((s: ImageSlot) => !!s.url)
          : [];

        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingData = false;
        this.showToast('Failed to load hotel data. Please try again.', false, false);
        this.cdr.detectChanges();
      },
    });
  }

  retryLoadFeatures() {
    this.featuresLoading = true;
    this.featuresError   = false;
    this.hotelService.getHotelFeaturesFromApi(this.authToken).subscribe({
      next: f  => { this.availableDisplayFeatures = f; this.featuresLoading = false; this.cdr.detectChanges(); },
      error: () => { this.featuresLoading = false; this.featuresError = true; this.cdr.detectChanges(); },
    });
  }

  retryLoadBookingFeatures() {
    this.bookingFeaturesLoading = true;
    this.bookingFeaturesError   = false;
    this.hotelService.getBookingFeaturesFromApi(this.authToken).subscribe({
      next: items => {
        this.availableBookingFeatures = items.filter(
          f => f.id !== FULL_BOARD_API_ID && f.id !== HALF_BOARD_API_ID
        );
        this.bookingFeaturesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.bookingFeaturesLoading = false; this.bookingFeaturesError = true; this.cdr.detectChanges(); },
    });
  }

  calcTotal() {
    this.rooms.total = this.rooms.single + this.rooms.double + this.rooms.triple + this.rooms.suite;
  }

  setStatus(s: 'Active' | 'Inactive' | 'Blocked') { this.hotel.status = s; }

  getDisplayFeatureLabel(id: number): string {
    const f = this.availableDisplayFeatures.find(f => f.id === id);
    return f ? `${f.icon} ${f.name}` : '';
  }

  toggleDisplayFeature(id: number) {
    const idx = this.selectedDisplayFeatureIds.indexOf(id);
    this.selectedDisplayFeatureIds = idx === -1
      ? [...this.selectedDisplayFeatureIds, id]
      : this.selectedDisplayFeatureIds.filter(i => i !== id);
  }

  isDisplayFeatureSelected(id: number): boolean {
    return this.selectedDisplayFeatureIds.includes(id);
  }

  closeDisplayDropdown() { this.displayDropdownOpen = false; }

  get remainingBookingFeatures(): BookingFeatureApiItem[] {
    const usedIds = this.extraBookingFeatures.map(f => f.apiId);
    return this.availableBookingFeatures.filter(f => !usedIds.includes(f.id));
  }

  get selectedBookingFeature(): BookingFeatureApiItem | null {
    return this.availableBookingFeatures.find(f => f.id === this.selectedBookingFeatureId) ?? null;
  }

  selectBookingFeature(id: number) {
    this.selectedBookingFeatureId = id;
    this.bookingDropdownOpen      = false;
  }

  addBookingFeature() {
    if (!this.selectedBookingFeatureId) return;
    const feature = this.availableBookingFeatures.find(f => f.id === this.selectedBookingFeatureId);
    if (!feature || this.extraBookingFeatures.some(f => f.apiId === feature.id)) return;

    this.extraBookingFeatures = [
      ...this.extraBookingFeatures,
      { apiId: feature.id, name: feature.name, icon: feature.icon, price: this.newBookingFeaturePrice ?? 0 },
    ];
    this.selectedBookingFeatureId = null;
    this.newBookingFeaturePrice   = 0;
    this.bookingDropdownOpen      = false;
  }

  removeExtraBookingFeature(i: number) {
    this.extraBookingFeatures = this.extraBookingFeatures.filter((_, idx) => idx !== i);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.images.push({ id: null, url: e.target.result as string });
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeImage(i: number) {
    const slot = this.images[i];
    if (slot.id !== null && this.hotelId !== null) {
      this.hotelService.deleteHotelImage(this.hotelId, slot.id, this.authToken).subscribe({
        next: () => { this.images.splice(i, 1); this.cdr.detectChanges(); },
        error: () => { this.showToast('Failed to delete image. Please try again.', false, false); },
      });
    } else {
      const newIndex = this.images.slice(0, i).filter(s => s.id === null).length;
      this.images.splice(i, 1);
      this.selectedFiles.splice(newIndex, 1);
    }
  }

  showToast(msg: string, navigate = true, success = true) {
    this.toastMessage = msg;
    this.toastSuccess = success;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
      if (navigate) this.router.navigate(['/admin/hotels']);
    }, 1800);
  }

  private buildApiPayload(): AdminAddHotelRequest {
    const discount      = Math.min(100, Math.max(0, Number(this.hotel.discount)         ?? 0));
    const serviceCharge = Math.min(100, Math.max(0, Number(this.hotel.serviceChargePct) ?? 0));

    const bookingFeatures: AdminBookingFeaturePayload[] = this.extraBookingFeatures
      .filter(f => f.apiId > 0)
      .map(f => ({ bookingFeatureId: f.apiId, price: Number(f.price) || 0 }));

    const payload: AdminAddHotelRequest = {
      name:           this.hotel.name.trim(),
      description:    this.hotel.description.trim(),
      location:       this.hotel.location.trim(),
      rating:         Number(this.hotel.rating),
      singleRooms:    Number(this.rooms.single)        || 0,
      singlePrice:    Number(this.roomPrices.standard) || 0,
      doubleRooms:    Number(this.rooms.double)        || 0,
      doublePrice:    Number(this.roomPrices.double)   || 0,
      tripleRooms:    Number(this.rooms.triple)        || 0,
      triplePrice:    Number(this.roomPrices.triple)   || 0,
      suiteRooms:     Number(this.rooms.suite)         || 0,
      suitePrice:     Number(this.roomPrices.suite)    || 0,
      discount,
      serviceCharge,
      fullBoardPrice: Number(this.fullBoardPrice) || 0,
      halfBoardPrice: Number(this.halfBoardPrice) || 0,
      featureIds:     [...this.selectedDisplayFeatureIds],
      bookingFeatures,
    };

    return payload;
  }

  private validate(): string | null {
    if (!this.hotel.name.trim())        return 'Hotel name is required.';
    if (!this.hotel.location.trim())    return 'Location is required.';
    if (!this.hotel.description.trim()) return 'Description is required.';
    if (!this.hotel.rating)             return 'Rating is required.';
    if (Number(this.hotel.rating) < 0 || Number(this.hotel.rating) > 5)
                                        return 'Rating must be between 0 and 5.';
    if (!this.roomPrices.standard)      return 'Standard room price is required.';
    return null;
  }

  save() {
    const err = this.validate();
    if (err) { this.showToast(err, false, false); return; }

    const payload = this.buildApiPayload();
    const token   = this.authToken;
    this.isSaving = true;

    if (this.isEdit && this.hotelId !== null) {
      this.doUpdate(payload, token);
    } else {
      this.doAdd(payload, token);
    }
  }

  private doAdd(payload: AdminAddHotelRequest, token: string) {
    this.hotelService.addHotelAdmin(payload, [], token).subscribe({
      next: (response) => {
        const newId   = response.id;
        const newUrls = this.images.filter(s => s.id === null).map(s => s.url);

        if (newId && newUrls.length > 0) {
          this.hotelService.uploadHotelImages(newId, newUrls, token).subscribe({
            next:  () => { this.isSaving = false; this.showToast('Hotel added successfully!'); },
            error: () => { this.isSaving = false; this.showToast('Hotel added, but image upload failed.'); },
          });
        } else {
          this.isSaving = false;
          this.showToast('Hotel added successfully!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message ?? err?.error ?? 'Failed to add hotel.';
        this.showToast(typeof msg === 'string' ? msg : 'Failed to add hotel.', false, false);
      },
    });
  }

  private doUpdate(payload: AdminAddHotelRequest, token: string) {
    const hotelId = this.hotelId!;

    this.hotelService.updateHotelAdmin(hotelId, payload, [], token).subscribe({
      next: () => {
        // Fire-and-forget status update — continues regardless of result
        this.hotelService.updateHotelStatus(hotelId, this.hotel.status, token)
          .subscribe({ next: () => {}, error: () => {} });
        this.uploadNewImagesIfAny(hotelId, token);
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message ?? err?.error ?? 'Failed to update hotel.';
        this.showToast(typeof msg === 'string' ? msg : 'Failed to update hotel.', false, false);
      },
    });
  }

  private uploadNewImagesIfAny(hotelId: number, token: string) {
    const newDataUrls = this.images
      .filter(s => s.id === null && s.url.startsWith('data:'))
      .map(s => s.url);

    if (newDataUrls.length > 0) {
      this.hotelService.uploadHotelImages(hotelId, newDataUrls, token).subscribe({
        next:  () => { this.isSaving = false; this.showToast('Hotel updated successfully!'); },
        error: () => { this.isSaving = false; this.showToast('Hotel updated, but image upload failed.'); },
      });
    } else {
      this.isSaving = false;
      this.showToast('Hotel updated successfully!');
    }
  }

  clear() {
    this.hotel                     = { name: '', rating: '', description: '', location: '', status: 'Active', discount: 0, serviceChargePct: 0 };
    this.roomPrices                = { standard: 0, double: 0, triple: 0, suite: 0 };
    this.rooms                     = { total: 0, single: 0, double: 0, triple: 0, suite: 0 };
    this.images                    = [];
    this.selectedFiles             = [];
    this.selectedDisplayFeatureIds = [];
    this.fullBoardPrice            = 0;
    this.halfBoardPrice            = 0;
    this.extraBookingFeatures      = [];
    this.selectedBookingFeatureId  = null;
    this.newBookingFeaturePrice    = 0;
    this.bookingDropdownOpen       = false;
  }
}