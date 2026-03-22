import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../../../core/services/favorites.service';


export interface Attraction {
  id: number;
  name: string;
  location: string;
  rating: number;
  images: string[];
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
  styleUrls: ['./card.css']
})
export class TouristAttractionCard {

  constructor(
    private router: Router,
    private favoritesService: FavoritesService // حقن السيرفس الموحدة
  ) {}

  attractions: Attraction[] = [
    {
      id: 1,
      name: 'Wadi El Hitan Protected Area',
      location: 'Fayoum, Egypt',
      rating: 4,
      images: ['https://picsum.photos/seed/wadi1/800/500'],
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod.',
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
      images: ['https://picsum.photos/seed/rayan1/800/500'],
      description: 'Wadi El Rayan is a protected area featuring the only natural waterfalls in Egypt.',
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
      images: ['https://picsum.photos/seed/qarun1/800/500'],
      description: 'Lake Qarun is one of Egypt\'s oldest natural lakes and a protected area.',
      place: 'Fayoum, Egypt',
      dateOfInscription: 1989,
      criteria: 'IX',
      property: '25,000 Ha',
      bufferZone: '4,200 Ha',
      dossier: 980,
      ticketPrice: 50
    }
  ];

  // فنكشن التأكد من المفضلة عن طريق الاسم
  isFavorite(name: string): boolean {
    return this.favoritesService.getFavorites().some(f => f.title === name);
  }

  // فنكشن الـ Toggle الموحدة
  toggleFavorite(event: Event, attraction: Attraction) {
    event.stopPropagation();
    if (this.isFavorite(attraction.name)) {
      const favs = this.favoritesService.getFavorites();
      const index = favs.findIndex(f => f.title === attraction.name);
      this.favoritesService.removeFavorite(index);
    } else {
      this.favoritesService.addToFavorites({
        title: attraction.name,
        image: attraction.images[0],
        price: attraction.ticketPrice + ' le / Ticket', // شكل السعر في المفضلة
        rating: attraction.rating
      });
    }
  }

  goToDetails(id: number) {
    this.router.navigate(['/tourist-attraction/details', id]);
  }
}