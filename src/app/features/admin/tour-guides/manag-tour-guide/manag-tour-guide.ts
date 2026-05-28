import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-manage-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // ✅ اللغات بتيجي من GET /admin/tour-guides/languages
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
        // ── EDIT MODE ──────────────────────────────────────
        this.isEdit = true;
        this.editId = +p['id'];

        // ✅ بنجيب اللغات والـ guide data مع بعض بـ forkJoin
        forkJoin({
          langs: this.tourGuideService.adminGetLanguages(),
          guide: this.tourGuideService.getById_API(this.editId)
        }).subscribe({
          next: ({ langs, guide: existing }) => {
            // ✅ حط اللغات المتاحة من الـ API
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

            // ✅ الـ languages بتيجي strings من الـ API
            // بنعمل match بالاسم مع الـ availableLanguages عشان نجيب الـ ids
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
            // Fallback: لو الـ API فشل، جيب اللغات لوحدها وخد الـ data من الـ cache
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
        // ── ADD MODE ───────────────────────────────────────
        // ✅ جيب اللغات من GET /admin/tour-guides/languages
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

  // ✅ toggle اختيار/إلغاء لغة
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

    this.selectedFile = file;
    this.images = [URL.createObjectURL(this.selectedFile)];
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
    // ── Validation ──────────────────────────────────────────
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
    // ✅ لازم يختار لغة واحدة على الأقل
    if (this.selectedLanguageIds.length === 0) {
      this.showToast('Please select at least one language.', false, false); return;
    }

    // ── Payload — بيتبعت للـ API ────────────────────────────
    // ✅ languages بيتبعت كـ number[] (ids) مش strings
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
      // ── PUT /admin/tour-guides/{id} ──────────────────────
      this.tourGuideService.adminUpdate(this.editId, payload).subscribe({
        next: () => {
          if (this.selectedFile) {
            // ✅ POST /admin/tour-guides/{id}/image
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
      // ── POST /admin/tour-guides ──────────────────────────
      this.tourGuideService.adminAdd(payload).subscribe({
        next: (res: any) => {
          const newId = res?.id ?? res?.data?.id ?? (typeof res === 'number' ? res : null);
          if (this.selectedFile && newId) {
            // ✅ POST /admin/tour-guides/{newId}/image
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
    this.images             = [];
    this.selectedFile       = null;
    this.selectedLanguageIds = [];
  }
}