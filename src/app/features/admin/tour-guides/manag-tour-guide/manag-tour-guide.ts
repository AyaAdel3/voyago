import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TourGuideService, TourGuide } from '../../../../core/services/tour-guide.service';

@Component({
  selector: 'app-manage-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manag-tour-guide.html',
  styleUrls: ['../../admin-shared.css', './manag-tour-guide.css'],
})
export class ManageTourGuide implements OnInit {
  isEdit = false;
  editId: number | null = null;
  images: string[] = [];
  toastMessage = '';
  toastVisible = false;

  guide = {
    name: '', email: '', languages: '', phone: '',
    tours: '0', rating: '4.5', description: '',
    status: 'Active', pricePerDay: 150,
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
        const existing = this.tourGuideService.getById(this.editId);
        if (existing) {
          this.guide = {
            name: existing.name,
            email: existing.email,
            languages: existing.languages.join(', '),
            phone: existing.phone,
            tours: existing.tours.toString(),
            rating: existing.rating.toString(),
            description: existing.description,
            status: existing.status,
            pricePerDay: existing.pricePerDay,
          };
          this.images = [existing.image];
        }
      }
    });
  }

  setStatus(s: string) { this.guide.status = s; }
  removeImage(i: number) { this.images.splice(i, 1); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    if (this.images.length >= 1) {
      this.toastMessage = 'Only 1 photo allowed. Remove the current one first.';
      this.toastVisible = true;
      this.cdr.detectChanges();
      input.value = '';
      return;
    }

    const file = input.files[0];
    this.images = [URL.createObjectURL(file)];
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
    const guideData = {
      name: this.guide.name,
      email: this.guide.email,
      languages: this.guide.languages.split(',').map(l => l.trim()),
      phone: this.guide.phone,
      tours: +this.guide.tours,
      rating: +this.guide.rating,
      description: this.guide.description,
      status: this.guide.status,
      image: this.images[0] || '',
      pricePerDay: +this.guide.pricePerDay,
      liked: false,
    };
    if (this.isEdit && this.editId) {
      this.tourGuideService.update(this.editId, guideData);
      this.showToast('Tour Guide updated successfully!');
    } else {
      this.tourGuideService.add(guideData);
      this.showToast('Tour Guide added successfully!');
    }
  }

  clear() {
    this.guide = {
      name: '', email: '', languages: '', phone: '',
      tours: '0', rating: '4.5', description: '', status: 'Active', pricePerDay: 150
    };
    this.images = [];
  }
}