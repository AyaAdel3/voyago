import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AttractionService } from '../../../../core/services/attraction.service';

// Categories ثابتة محلياً عشان الـ API مش بترجعهم
export interface Category {
  id: number;
  icon: string;
  name: string;
}

const LOCAL_CATEGORIES: Category[] = [
  { id: 1, icon: '🏛️', name: 'Historical' },
  { id: 2, icon: '🌿', name: 'Natural'    },
];

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
  images: string[] = [];
  toastMessage = '';
  toastVisible = false;

  availableCategories: Category[] = LOCAL_CATEGORIES;
  selectedCategoryIds: number[] = [];
  categoriesDropdownOpen = false;

  attraction = {
    name:              '',
    rating:            0,
    description:       '',
    location:          '',
    ticketPrice:       0,
    dateOfInscription: 0,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private attractionService: AttractionService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.attractionId = +params['id'];
        this.isEdit = true;
        this.loadAttraction(this.attractionId);
      }
    });
  }

  private loadAttraction(id: number) {
    this.attractionService.getById(id).subscribe({
      next: (found) => {
        // الصور من الـ API هي objects، بنحول لـ string URLs
        this.images = found.images.map(img => img.imageUrl);
        this.attraction = {
          name:              found.name,
          rating:            found.rating,
          description:       found.description,
          location:          found.location,
          ticketPrice:       found.ticketPrice,
          dateOfInscription: found.yearOfInscription,
        };
        // نختار الـ category الموافقة من اسمها
        const match = LOCAL_CATEGORIES.find(c =>
          c.name.toLowerCase() === found.category?.toLowerCase()
        );
        if (match) this.selectedCategoryIds = [match.id];
      },
      error: (err) => console.error('Error loading attraction:', err)
    });
  }

  getCategoryLabel(id: number): string {
    const found = this.availableCategories.find(c => c.id === id);
    return found ? `${found.icon} ${found.name}` : '';
  }

  toggleCategory(id: number) {
    this.selectedCategoryIds = this.selectedCategoryIds.includes(id) ? [] : [id];
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds.includes(id);
  }

  closeCategoryDropdown() { this.categoriesDropdownOpen = false; }

  onFileSelected(event: Event): void {
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
      if (navigate) this.router.navigate(['/admin/attractions']);
    }, 1800);
  }

  save() {
    if (!this.attraction.name || !this.selectedCategoryIds.length) {
      this.showToast('Please fill all required fields.', false);
      return;
    }
    // هنا تقدر تضيف POST/PUT call للـ API لما يكون جاهز من الـ backend
    this.showToast(this.isEdit ? 'Attraction updated successfully!' : 'Attraction added successfully!');
  }

  clear() {
    this.attraction = {
      name: '', rating: 0, description: '',
      location: '', ticketPrice: 0, dateOfInscription: 0,
    };
    this.images              = [];
    this.selectedCategoryIds = [];
  }
}