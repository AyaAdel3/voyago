import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../../../core/services/hotel.service';
import { Hotel } from '../../../../core/model/hotel.model';

@Component({
  selector: 'app-admin-hotels',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hotels.html',
  styleUrls: ['../../admin-shared.css', './hotels.css'],
})
export class AdminHotels implements OnInit {
  searchQuery = '';
  currentPage = 1;
  totalPages  = [1, 2, 3, 4, 10];

  hotels: (Hotel & { status: string })[] = [];

  deleteToastVisible = false;
  deleteToastMessage = '';

  stats = [
    { label: 'Total Hotels', value: 0, icon: '🏨', type: 'total'    },
    { label: 'Active',       value: 0, icon: '✓',  type: 'active'   },
    { label: 'Inactive',     value: 0, icon: '⊘',  type: 'inactive' },
    { label: 'Blocked',      value: 0, icon: '⚠',  type: 'blocked'  },
  ];

  constructor(
    private router: Router,
    private hotelService: HotelService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.hotelService.getHotels().subscribe(hotels => {
      this.hotels = hotels.map(h => ({
        ...h,
        status: (h as any).status ?? 'Active',
      }));
      this.updateStats();
    });
  }

  updateStats(): void {
    this.stats[0].value = this.hotels.length;
    this.stats[1].value = this.hotels.filter(h => h.status === 'Active').length;
    this.stats[2].value = this.hotels.filter(h => h.status === 'Inactive').length;
    this.stats[3].value = this.hotels.filter(h => h.status === 'Blocked').length;
  }

  get filtered() {
    if (!this.searchQuery) return this.hotels;
    return this.hotels.filter(h =>
      h.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  showDeleteToast(msg: string) {
    this.deleteToastMessage = msg;
    this.deleteToastVisible = true;
    setTimeout(() => {
      this.deleteToastVisible = false;
      this.cdr.detectChanges();
    }, 6000);
  }

  viewOnSite(hotel: Hotel) {
    window.open(`/hotels/details/${hotel.id}`, '_blank');
  }

  edit(hotel: Hotel) {
    this.router.navigate(['/admin/hotels/manage'], { queryParams: { id: hotel.id } });
  }

  delete(hotel: Hotel) {
    this.hotelService.deleteHotel(hotel.id);
    this.showDeleteToast(`"${hotel.name}" deleted successfully.`);
  }
}