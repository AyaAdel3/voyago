import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-manage-attraction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-attraction.html',
  styleUrls: ['../../admin-shared.css'],
})
export class ManageAttraction implements OnInit {
  isEdit = false;
  images: string[] = [
    'https://picsum.photos/seed/a1/400/300',
    'https://picsum.photos/seed/a2/400/300',
    'https://picsum.photos/seed/a3/400/300',
    'https://picsum.photos/seed/a4/400/300',
  ];
  attraction = { name: '', fee: '', category: '', rating: '4.5', description: '', status: 'Active' };

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.attraction = { name: 'Wadi El Hitan', fee: '189', category: 'Historical', rating: '4.8', description: 'Amazing historical site...', status: 'Active' };
      }
    });
  }

  setStatus(s: string) { this.attraction.status = s; }
  save() { alert(`Attraction ${this.isEdit ? 'updated' : 'saved'} successfully!`); this.router.navigate(['/admin/attractions']); }
  clear() { this.attraction = { name: '', fee: '', category: '', rating: '4.5', description: '', status: 'Active' }; }
  removeImage(i: number) { this.images.splice(i, 1); }
}