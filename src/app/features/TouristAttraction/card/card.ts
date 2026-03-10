import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Attraction {
  id: number;
  name: string;
  location: string;
  rating: number;
  image: string;
  description: string;
  place: string;
  dateOfInscription: number;
  criteria: string;
  property: string;
  bufferZone: string;
  dossier: number;
  ticketPrice: number;
}

@Component({
  selector: 'app-tourist-attraction-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class TouristAttractionCard {
  favorites: number[] = JSON.parse(localStorage.getItem('favorites') || '[]');

  constructor(private router: Router) {}

  attractions: Attraction[] = [
    {
      id: 1,
      name: 'Wadi El Hitan Protected Area',
      location: 'Fayoum, Egypt',
      rating: 4,
      image: 'https://picsum.photos/seed/wadi/800/400',
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta urna. earliest extinct suborder of whales.',
      place: 'Fayoum, Egypt',
      dateOfInscription: 2005,
      criteria: 'VIII',
      property: '20,015 Ha',
      bufferZone: '3,805 Ha',
      dossier: 1186,
      ticketPrice: 100
    },
    {
      id: 2,
      name: 'Wadi El Rayan Waterfalls',
      location: 'Fayoum, Egypt',
      rating: 5,
      image: 'https://picsum.photos/seed/rayan/800/400',
      description: 'Wadi El Rayan is a protected area featuring the only natural waterfalls in Egypt. Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta urna.',
      place: 'Fayoum, Egypt',
      dateOfInscription: 2003,
      criteria: 'VII',
      property: '18,000 Ha',
      bufferZone: '2,500 Ha',
      dossier: 1050,
      ticketPrice: 80
    },
    {
      id: 3,
      name: 'Lake Qarun',
      location: 'Fayoum, Egypt',
      rating: 4,
      image: 'https://picsum.photos/seed/qarun/800/400',
      description: 'Lake Qarun is one of Egypt\'s oldest natural lakes and a protected area. Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta urna.',
      place: 'Fayoum, Egypt',
      dateOfInscription: 1989,
      criteria: 'IX',
      property: '25,000 Ha',
      bufferZone: '4,200 Ha',
      dossier: 980,
      ticketPrice: 50
    }
  ];

  isFavorite(id: number): boolean {
    return this.favorites.includes(id);
  }

  toggleFavorite(event: Event, id: number) {
    event.stopPropagation();
    if (this.isFavorite(id)) {
      this.favorites = this.favorites.filter(f => f !== id);
    } else {
      this.favorites.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }

  goToDetails(id: number) {
    this.router.navigate(['/tourist-attraction/details', id]);
  }

  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}