import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AttractionService } from '../../../../core/services/attraction.service';

export interface Category {
  id: number;
  icon: string;
  name: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Historical: '🏛️',
  Natural: '🌿',
  Cultural: '🎭',
  Religious: '🕌',
  Adventure: '🏔️',
};

interface ExistingImage {
  id: number;
  url: string;
}

@Component({
  selector: 'app-manage-attraction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-attraction.html',
  styleUrls: ['../../admin-shared.css', './manage-attraction.css'],
})
export class ManageAttraction implements OnInit {
  isEdit = false;
  attractionId: number | null = null;

  existingImages: ExistingImage[] = [];
  newImagePreviews: string[] = [];
  newImageFiles: File[] = [];

  toastMessage = '';
  toastVisible = false;
  toastSuccess = true;
  isSaving = false;

  availableCategories: Category[] = [];
  selectedCategoryIds: number[] = [];
  categoriesDropdownOpen = false;

  attraction: {
    name: string;
    rating: number | null;
    description: string;
    location: string;
    ticketPrice: number | null;
    dateOfInscription: number | null;
  } = {
    name: '',
    rating: null,
    description: '',
    location: '',
    ticketPrice: null,
    dateOfInscription: null,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private attractionService: AttractionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.attractionId = +params['id'];
        this.isEdit = true;
      }
      this.loadCategories();
    });
  }

  private loadCategories(): void {
    this.attractionService.adminGetCategories().subscribe({
      next: (cats) => {
        this.availableCategories = cats.map((c) => ({
          id: c.id,
          name: c.name,
          icon: CATEGORY_ICONS[c.name] ?? '📍',
        }));
        if (this.isEdit && this.attractionId) {
          this.loadAttraction(this.attractionId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.cdr.detectChanges();
      },
    });
  }

  private loadAttraction(id: number): void {
    this.attractionService.getById(id).subscribe({
      next: (found) => {
        this.existingImages = found.images.map((img) => ({
          id: img.id,
          url: img.imageUrl,
        }));
        this.attraction = {
          name: found.name,
          rating: found.rating,
          description: found.description,
          location: found.location,
          ticketPrice: found.ticketPrice,
          dateOfInscription: found.yearOfInscription,
        };
        const match = this.availableCategories.find(
          (c) => c.name.toLowerCase() === found.category?.toLowerCase()
        );
        if (match) {
          this.selectedCategoryIds = [match.id];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading attraction:', err);
        this.cdr.detectChanges();
      },
    });
  }

  get allImages(): { url: string; isExisting: boolean; id?: number; newIndex?: number }[] {
    const existing = this.existingImages.map((img) => ({
      url: img.url,
      isExisting: true,
      id: img.id,
    }));
    const newImgs = this.newImagePreviews.map((url, i) => ({
      url,
      isExisting: false,
      newIndex: i,
    }));
    return [...existing, ...newImgs];
  }

  removeImage(isExisting: boolean, id?: number, newIndex?: number): void {
    if (isExisting && id !== undefined && this.attractionId) {
      this.attractionService.adminDeleteImage(this.attractionId, id).subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter((img) => img.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error deleting image:', err),
      });
    } else if (!isExisting && newIndex !== undefined) {
      this.newImagePreviews.splice(newIndex, 1);
      this.newImageFiles.splice(newIndex, 1);
    }
  }

  getCategoryLabel(id: number): string {
    const found = this.availableCategories.find((c) => c.id === id);
    return found ? `${found.icon} ${found.name}` : '';
  }

  toggleCategory(id: number): void {
    this.selectedCategoryIds = this.selectedCategoryIds.includes(id) ? [] : [id];
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  closeCategoryDropdown(): void {
    this.categoriesDropdownOpen = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((file) => {
      this.newImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.newImagePreviews.push(e.target.result as string);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  showToast(msg: string, navigate = true, success = true): void {
    this.toastMessage = msg;
    this.toastSuccess = success;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
      if (navigate) this.router.navigate(['/admin/attractions']);
    }, 1800);
  }

  save(): void {
    if (!this.attraction.name.trim()) {
      this.showToast('Attraction name is required.', false, false); return;
    }
    if (!this.attraction.location.trim()) {
      this.showToast('Location is required.', false, false); return;
    }
    if (!this.selectedCategoryIds.length) {
      this.showToast('Please select a category.', false, false); return;
    }
    if (!this.attraction.description.trim()) {
      this.showToast('Description is required.', false, false); return;
    }

    const price = +(this.attraction.ticketPrice ?? 0);
    if (isNaN(price) || price <= 0) {
      this.showToast('Ticket price must be greater than 0.', false, false); return;
    }

    const year = +(this.attraction.dateOfInscription ?? 0);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year <= 0) {
      this.showToast('Date of inscription must be a valid positive year.', false, false); return;
    }
    if (year > currentYear) {
      this.showToast(`Date of inscription can't be in the future.`, false, false); return;
    }

    const rating = +(this.attraction.rating ?? -1);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      this.showToast('Rating must be between 0 and 5.', false, false); return;
    }

    this.isSaving = true;

    const payload = {
      name: this.attraction.name.trim(),
      description: this.attraction.description.trim(),
      Location: this.attraction.location.trim(),
      yearOfInscription: year,
      ticketPrice: price,
      rating: rating,
      category: this.selectedCategoryIds[0],
    };

    const uploadNewImages = (id: number) => {
      if (this.newImageFiles.length) {
        this.attractionService.adminAddImages(id, this.newImageFiles).subscribe({
          next: () => {
            this.isSaving = false;
            this.showToast(
              this.isEdit ? 'Attraction updated successfully!' : 'Attraction added successfully!',
              true, true
            );
          },
          error: () => {
            this.isSaving = false;
            this.showToast(
              this.isEdit ? 'Attraction updated successfully!' : 'Attraction added successfully!',
              true, true
            );
          },
        });
      } else {
        this.isSaving = false;
        this.showToast(
          this.isEdit ? 'Attraction updated successfully!' : 'Attraction added successfully!',
          true, true
        );
      }
    };

    if (this.isEdit && this.attractionId) {
      this.attractionService.adminUpdate(this.attractionId, payload).subscribe({
        next: () => uploadNewImages(this.attractionId!),
        error: (err) => {
          console.error(err);
          this.showToast('Failed to update attraction.', false, false);
          this.isSaving = false;
        },
      });
    } else {
      this.attractionService.adminAdd(payload).subscribe({
        next: (res) => uploadNewImages(res?.id),
        error: (err) => {
          console.error(err);
          this.showToast('Failed to add attraction.', false, false);
          this.isSaving = false;
        },
      });
    }
  }

  clear(): void {
    this.attraction = {
      name: '',
      rating: null,
      description: '',
      location: '',
      ticketPrice: null,
      dateOfInscription: null,
    };
    this.existingImages = [];
    this.newImagePreviews = [];
    this.newImageFiles = [];
    this.selectedCategoryIds = [];
    this.cdr.detectChanges();
  }
}