import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Attraction } from '../card/card';

const ATTRACTIONS: Attraction[] = [
  {
    id: 1,
    name: 'Wadi El Hitan Protected Area',
    location: 'Fayoum, Egypt',
    rating: 4,
    image: 'https://picsum.photos/seed/wadi/800/400',

    description: 'Wadi El Hitan, Whale Valley, is a paleontological site in the Faiyum desert of Egypt. It contains fossils of the earliest, and now extinct, suborder of whales. Wadi El Hitan at Night. The Pathway of Female Pharaohs: Wadi El Hitan is one of the most famous natural reserves in Egypt.',
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

    description: 'Wadi El Rayan is a protected area in Fayoum. It includes two lakes and the only natural waterfall in Egypt.',
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

    description: 'Lake Qarun is a saltwater lake in Fayoum Governorate. It is one of the oldest lakes in the world.',
    place: 'Fayoum, Egypt',
    dateOfInscription: 1998,
    criteria: 'IX',
    property: '25,000 Ha',
    bufferZone: '4,200 Ha',
    dossier: 980,
    ticketPrice: 50
  }
];

@Component({
  selector: 'app-tourist-attraction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class TouristAttractionDetails implements OnInit {
  attraction: Attraction | undefined;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.attraction = ATTRACTIONS.find(a => a.id === id);
  }

  goBack() { this.router.navigate(['/Attractions']); }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
