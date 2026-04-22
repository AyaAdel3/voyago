import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-manage-tour-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manag-tour-guide.html',
  styleUrls: ['../../admin-shared.css'],
})
export class ManageTourGuide implements OnInit {
  isEdit = false;
  images: string[] = [
    'https://picsum.photos/seed/g1/400/300',
    'https://picsum.photos/seed/g2/400/300',
    'https://picsum.photos/seed/g3/400/300',
    'https://picsum.photos/seed/g4/400/300',
  ];

  guide = {
    name: '',
    email: '',
    languages: '',
    phone: '',
    tours: '0',
    rating: '4.5',
    description: '',
    status: 'Active',
  };

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.guide = {
          name: 'Sarah Malik',
          email: 'sarah@rv.com',
          languages: 'English, Spanish',
          phone: '+20100128346',
          tours: '189',
          rating: '4.6',
          description: 'Experienced tour guide...',
          status: 'Active',
        };
      }
    });
  }

  setStatus(s: string) { this.guide.status = s; }

  save() {
    if (!this.guide.name || !this.guide.email) return;
    alert(`Tour Guide ${this.isEdit ? 'updated' : 'saved'} successfully!`);
    this.router.navigate(['/admin/tour-guides']);
  }

  clear() {
    this.guide = { name: '', email: '', languages: '', phone: '', tours: '0', rating: '4.5', description: '', status: 'Active' };
  }

  removeImage(i: number) { this.images.splice(i, 1); }
}