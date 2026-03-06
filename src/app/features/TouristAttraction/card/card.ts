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
  constructor(private router: Router) {}

  attractions: Attraction[] = [
    {
      id: 1,
      name: 'Wadi El Hitan Protected Area',
      location: 'Fayoum, Egypt',
      rating: 4,
      image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
      description: 'Wadi El Hitan, Whale Valley, is a UNESCO World Heritage Site in the Western Desert of Egypt. It contains 40-million-year-old fossils of the earliest extinct suborder of whales.',
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
      image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
      description: 'Wadi El Rayan is a protected area featuring the only natural waterfalls in Egypt. It includes two beautiful lakes connected by cascading waterfalls in the heart of the desert.',
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
      image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800',
      description: 'Lake Qarun is one of Egypt\'s oldest natural lakes and a protected area. It is a haven for migratory birds and offers water sports and fishing activities.',
      place: 'Fayoum, Egypt',
      dateOfInscription: 1989,
      criteria: 'IX',
      property: '25,000 Ha',
      bufferZone: '4,200 Ha',
      dossier: 980,
      ticketPrice: 50
    }
  ];

  goToDetails(id: number) {
    this.router.navigate(['/tourist-attraction/details', id]);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
