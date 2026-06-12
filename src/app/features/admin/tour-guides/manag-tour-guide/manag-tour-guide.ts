import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';
import { forkJoin } from 'rxjs';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-manage-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './manag-tour-guide.html',
  styleUrls: ['../../admin-shared.css', './manag-tour-guide.css'],
})
export class ManageTourGuide implements OnInit {
  isEdit   = false;
  editId: number | null = null;
  images: string[] = [];
  selectedFile: File | null = null;
  toastMessage = '';
  toastVisible = false;
  toastSuccess = true;
  isLoading    = false;

  // ✅ Crop
  showCropper = false;
  imageChangedEvent: Event | null = null;
  croppedImage = '';
  croppedFile: File | null = null;

  availableLanguages: { id: number; name: string }[] = [];
  selectedLanguageIds: number[] = [];

  guide = {
    name:        '',
    email:       '',
    phone:       '',
    rating:      '',
    description: '',
    pricePerDay: '' as string | number,
    status:      'Active',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tourGuideService: TourGuideService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.editId = +p['id'];

        forkJoin({
          langs: this.tourGuideService.adminGetLanguages(),
          guide: this.tourGuideService.getById_API(this.editId)
        }).subscribe({
          next: ({ langs, guide: existing }) => {
            this.availableLanguages = langs;

            this.guide = {
              name:        existing.name        ?? '',
              email:       existing.email       ?? '',
              phone:       existing.phoneNumber ?? existing.phone ?? '',
              rating:      existing.rating != null ? existing.rating.toString() : '4.5',
              description: existing.description ?? '',
              pricePerDay: existing.pricePerDay ?? '',
              status:      existing.status      ?? 'Active',
            };

            this.images = existing.profilePictureUrl
              ? [existing.profilePictureUrl]
              : existing.image ? [existing.image] : [];

            if (Array.isArray(existing.languages) && existing.languages.length) {
              const guideLanguageNames = existing.languages.map(
                (l: string) => l.toLowerCase().trim()
              );
              this.selectedLanguageIds = langs
                .filter(l => guideLanguageNames.includes(l.name.toLowerCase().trim()))
                .map(l => l.id);
            }

            this.cdr.detectChanges();
          },
          error: () => {
            this.tourGuideService.adminGetLanguages().subscribe({
              next: langs => {
                this.availableLanguages = langs;
                const cached = this.tourGuideService.getById(this.editId!);
                if (cached) {
                  this.guide = {
                    name:        cached.name        ?? '',
                    email:       cached.email       ?? '',
                    phone:       cached.phoneNumber ?? cached.phone ?? '',
                    rating:      cached.rating != null ? cached.rating.toString() : '',
                    description: cached.description ?? '',
                    pricePerDay: cached.pricePerDay ?? '',
                    status:      cached.status      ?? 'Active',
                  };
                  this.images = cached.profilePictureUrl
                    ? [cached.profilePictureUrl]
                    : cached.image ? [cached.image] : [];

                  if (Array.isArray(cached.languages) && cached.languages.length) {
                    const names = cached.languages.map(
                      (l: string) => l.toLowerCase().trim()
                    );
                    this.selectedLanguageIds = langs
                      .filter(l => names.includes(l.name.toLowerCase().trim()))
                      .map(l => l.id);
                  }
                  this.cdr.detectChanges();
                }
              }
            });
          }
        });

      } else {
        this.tourGuideService.adminGetLanguages().subscribe({
          next: langs => {
            this.availableLanguages = langs;
            this.cdr.detectChanges();
          },
          error: () => {}
        });
      }
    });
  }

  setStatus(s: string) { this.guide.status = s; }

  toggleLanguage(id: number): void {
    const idx = this.selectedLanguageIds.indexOf(id);
    if (idx === -1) this.selectedLanguageIds.push(id);
    else            this.selectedLanguageIds.splice(idx, 1);
  }

  isLangSelected(id: number): boolean {
    return this.selectedLanguageIds.includes(id);
  }

  removeImage(i: number) {
    this.images.splice(i, 1);
    this.selectedFile = null;
    this.croppedFile  = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    if (this.images.length >= 1) {
      this.showToast('Only 1 photo allowed. Remove the current one first.', false, false);
      input.value = '';
      return;
    }

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image size must be less than 5MB.', false, false);
      input.value = '';
      return;
    }

    this.imageChangedEvent = event;
    this.showCropper = true;
    this.cdr.detectChanges();
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedImage = event.base64;
      // ✅ نحول الـ base64 لـ File عشان نرفعه للـ API
      const arr = event.base64.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      this.croppedFile = new File([u8arr], 'tour-guide.jpg', { type: mime });
    } else if (event.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(event.blob);
      this.croppedFile = new File([event.blob], 'tour-guide.jpg', { type: 'image/jpeg' });
    }
  }

  saveCrop(): void {
    if (this.croppedImage) {
      this.images = [this.croppedImage];
      if (this.croppedFile) {
        this.selectedFile = this.croppedFile;
      }
    }
    this.showCropper       = false;
    this.croppedImage      = '';
    this.croppedFile       = null;
    this.imageChangedEvent = null;
    this.cdr.detectChanges();
  }

  cancelCrop(): void {
    this.showCropper       = false;
    this.imageChangedEvent = null;
    this.croppedImage      = '';
    this.croppedFile       = null;
  }

  showToast(msg: string, navigate = true, success = true) {
    this.toastMessage = msg;
    this.toastSuccess = success;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
      if (navigate) this.router.navigate(['/admin/tour-guides']);
    }, 1800);
  }

  save() {
    if (!this.guide.name.trim()) {
      this.showToast('Full name is required.', false, false); return;
    }
    if (!this.guide.email.trim()) {
      this.showToast('Email is required.', false, false); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.guide.email.trim())) {
      this.showToast('Please enter a valid email address.', false, false); return;
    }
    if (!this.guide.phone.trim()) {
      this.showToast('Phone number is required.', false, false); return;
    }
    const priceNum = +this.guide.pricePerDay;
    if (!priceNum || priceNum <= 0) {
      this.showToast('Price per day must be greater than 0.', false, false); return;
    }
    const ratingNum = +this.guide.rating;
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      this.showToast('Rating must be between 0 and 5.', false, false); return;
    }
    if (!this.guide.description.trim()) {
      this.showToast('Description is required.', false, false); return;
    }
    if (this.selectedLanguageIds.length === 0) {
      this.showToast('Please select at least one language.', false, false); return;
    }

    const payload = {
      name:        this.guide.name.trim(),
      email:       this.guide.email.trim(),
      phoneNumber: this.guide.phone.trim(),
      description: this.guide.description.trim(),
      rating:      ratingNum,
      pricePerDay: priceNum,
      languages:   this.selectedLanguageIds,
    };

    this.isLoading = true;

    if (this.isEdit && this.editId) {
      this.tourGuideService.adminUpdate(this.editId, payload).subscribe({
        next: () => {
          if (this.selectedFile) {
            this.tourGuideService.adminUploadImage(this.editId!, this.selectedFile).subscribe({
              next: () => {
                this.isLoading = false;
                this.showToast('Tour Guide updated successfully!', true, true);
              },
              error: () => {
                this.isLoading = false;
                this.showToast('Tour Guide updated, but image upload failed.', true, true);
              }
            });
          } else {
            this.isLoading = false;
            this.showToast('Tour Guide updated successfully!', true, true);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.handleApiError(err);
        }
      });

    } else {
      this.tourGuideService.adminAdd(payload).subscribe({
        next: (res: any) => {
          const newId = res?.id ?? res?.data?.id ?? (typeof res === 'number' ? res : null);
          if (this.selectedFile && newId) {
            this.tourGuideService.adminUploadImage(newId, this.selectedFile).subscribe({
              next: () => {
                this.isLoading = false;
                this.showToast('Tour Guide added successfully!', true, true);
              },
              error: () => {
                this.isLoading = false;
                this.showToast('Tour Guide added, but image upload failed.', true, true);
              }
            });
          } else {
            this.isLoading = false;
            this.showToast('Tour Guide added successfully!', true, true);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.handleApiError(err);
        }
      });
    }
  }

  private handleApiError(err: any): void {
    const errors = err?.error?.errors;
    if (errors) {
      const msgs = Object.values(errors).flat().join(' ');
      this.showToast(msgs, false, false);
    } else {
      const msg = err?.error?.message ?? err?.message ?? 'Something went wrong. Please try again.';
      this.showToast(msg, false, false);
    }
  }

  clear() {
    this.guide = {
      name: '', email: '', phone: '',
      rating: '', description: '', pricePerDay: '', status: 'Active',
    };
    this.images              = [];
    this.selectedFile        = null;
    this.croppedFile         = null;
    this.selectedLanguageIds = [];
  }
}