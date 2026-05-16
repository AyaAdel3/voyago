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
  isLoading    = false;

  availableLanguages: { id: number; name: string }[] = [];
  selectedLanguageIds: number[] = [];

  guide = {
    name:        '',
    email:       '',
    phone:       '',
    rating:      '4.5',
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
              // ✅ FIX: الـ admin API مش بيرجع rating — بنحط default لو مش موجود
              rating:      existing.rating != null ? existing.rating.toString() : '4.5',
              description: existing.description ?? '',
              pricePerDay: existing.pricePerDay ?? '',
              status:      existing.status      ?? 'Active',
            };

            // ✅ FIX: الصورة من profilePictureUrl مش image
            this.images = existing.profilePictureUrl
              ? [existing.profilePictureUrl]
              : existing.image
                ? [existing.image]
                : [];

            // ✅ FIX: languages بتيجي strings ["Arabic","English"]
            // بنعمل match مع الـ ids من availableLanguages
            if (Array.isArray(existing.languages) && existing.languages.length) {
              const guideLanguageNames = existing.languages.map((l: string) => l.toLowerCase());
              this.selectedLanguageIds = langs
                .filter(l => guideLanguageNames.includes(l.name.toLowerCase()))
                .map(l => l.id);
            }

            this.cdr.detectChanges();
          },
          error: () => {
            // Fallback: جرب الـ cache لو الـ API فشل
            this.tourGuideService.adminGetLanguages().subscribe({
              next: langs => {
                this.availableLanguages = langs;
                const cached = this.tourGuideService.getById(this.editId!);
                if (cached) {
                  this.guide = {
                    name:        cached.name        ?? '',
                    email:       cached.email       ?? '',
                    phone:       cached.phoneNumber ?? cached.phone ?? '',
                    rating:      cached.rating != null ? cached.rating.toString() : '4.5',
                    description: cached.description ?? '',
                    pricePerDay: cached.pricePerDay ?? '',
                    status:      cached.status      ?? 'Active',
                  };
                  this.images = cached.image ? [cached.image] : [];

                  if (Array.isArray(cached.languages) && cached.languages.length) {
                    const names = cached.languages.map((l: string) => l.toLowerCase());
                    this.selectedLanguageIds = langs
                      .filter(l => names.includes(l.name.toLowerCase()))
                      .map(l => l.id);
                  }
                  this.cdr.detectChanges();
                }
              }
            });
          }
        });

      } else {
        // Add mode
        this.tourGuideService.adminGetLanguages().subscribe({
          next: langs => { this.availableLanguages = langs; this.cdr.detectChanges(); },
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

  removeImage(i: number) { this.images.splice(i, 1); this.selectedFile = null; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    if (this.images.length >= 1) {
      this.showToast('Only 1 photo allowed. Remove the current one first.', false);
      input.value = '';
      return;
    }
    this.selectedFile = input.files[0];
    this.images = [URL.createObjectURL(this.selectedFile)];
  }

  showToast(msg: string, navigate = true) {
    this.toastMessage = msg;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
      if (navigate) this.router.navigate(['/admin/tour-guides']);
    }, 1800);
  }

  save() {
    if (!this.guide.name || !this.guide.email) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    const priceNum = +this.guide.pricePerDay;
    if (!priceNum || priceNum <= 0) {
      this.showToast('Price per day must be greater than 0.', false);
      return;
    }

    this.isLoading = true;

    const payload = {
      name:        this.guide.name.trim(),
      email:       this.guide.email.trim(),
      phoneNumber: this.guide.phone.trim(),
      description: this.guide.description.trim(),
      rating:      +this.guide.rating,
      pricePerDay: priceNum,
      languages:   this.selectedLanguageIds,
    };

    if (this.isEdit && this.editId) {
      this.tourGuideService.adminUpdate(this.editId, payload).subscribe({
        next: () => {
          if (this.selectedFile) {
            this.tourGuideService.adminUploadImage(this.editId!, this.selectedFile).subscribe({
              next:  () => { this.isLoading = false; this.showToast('Tour Guide updated successfully!'); },
              error: () => { this.isLoading = false; this.showToast('Tour Guide updated successfully!'); }
            });
          } else {
            this.isLoading = false;
            this.showToast('Tour Guide updated successfully!');
          }
        },
        error: (err) => {
          this.isLoading = false;
          const errors = err?.error?.errors;
          if (errors) {
            const msgs = Object.values(errors).flat().join(' ');
            this.showToast(msgs, false);
          } else {
            this.showToast(err?.error?.message ?? 'Failed to update. Please try again.', false);
          }
        }
      });
    } else {
      this.tourGuideService.adminAdd(payload).subscribe({
        next: (res: any) => {
          const newId = res?.id ?? res;
          if (this.selectedFile && newId) {
            this.tourGuideService.adminUploadImage(newId, this.selectedFile).subscribe({
              next:  () => { this.isLoading = false; this.showToast('Tour Guide added successfully!'); },
              error: () => { this.isLoading = false; this.showToast('Tour Guide added successfully!'); }
            });
          } else {
            this.isLoading = false;
            this.showToast('Tour Guide added successfully!');
          }
        },
        error: (err) => {
          this.isLoading = false;
          const errors = err?.error?.errors;
          if (errors) {
            const msgs = Object.values(errors).flat().join(' ');
            this.showToast(msgs, false);
          } else {
            this.showToast(err?.error?.message ?? 'Failed to add. Please try again.', false);
          }
        }
      });
    }
  }

  clear() {
    this.guide = {
      name:        '',
      email:       '',
      phone:       '',
      rating:      '4.5',
      description: '',
      pricePerDay: '',
      status:      'Active',
    };
    this.images = [];
    this.selectedFile = null;
    this.selectedLanguageIds = [];
  }
}