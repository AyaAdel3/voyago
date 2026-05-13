import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AttractionService, Attraction } from '../../../../core/services/attraction.service';

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

  attraction = {
    name: '',
    fee: 0,
    category: '',
    rating: 0,
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    location: '',
    ticketPrice: 0,
    place: '',
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
    const found = this.attractionService.getById(id);
    if (!found) return;
    this.images = [...found.images];
    this.attraction = {
      name: found.name,
      fee: found.fee,
      category: found.category,
      rating: found.rating,
      description: found.description,
      status: found.status as 'Active' | 'Inactive',
      location: found.location,
      ticketPrice: found.ticketPrice,
      place: found.place,
      dateOfInscription: found.dateOfInscription,
    };
  }

  setStatus(s: 'Active' | 'Inactive') { this.attraction.status = s; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const objectUrl = URL.createObjectURL(file);
    this.images.push(objectUrl);
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
    if (!this.attraction.name || !this.attraction.category) {
      this.showToast('Please fill all required fields.', false);
      return;
    }

    const data: Omit<Attraction, 'id'> = {
      ...this.attraction,
      images: [...this.images],
    };

    if (this.isEdit && this.attractionId !== null) {
      this.attractionService.update(this.attractionId, data);
      this.showToast('Attraction updated successfully!');
    } else {
      this.attractionService.add(data);
      this.showToast('Attraction added successfully!');
    }
  }

  clear() {
    this.attraction = {
      name: '', fee: 0, category: '', rating: 0,
      description: '', status: 'Active', location: '',
      ticketPrice: 0, place: '', dateOfInscription: 0,
    };
    this.images = [];
  }
}