import { Injectable } from '@angular/core';

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
  category: string;
  status: string;
  fee: number;
}

@Injectable({ providedIn: 'root' })
export class AttractionService {
  private attractions: Attraction[] = [
    {
      id: 1, name: 'Wadi El Hitan Protected Area', location: 'Fayoum, Egypt',
      rating: 4,
      images: [
        'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=500&fit=crop',
      ],
      description: 'Wadi El Hitan, Whale Valley, is a paleontological site in the Faiyum desert of Egypt. It contains fossils of the earliest, and now extinct, suborder of whales. Wadi El Hitan at Night. The Pathway of Female Pharaohs: Wadi El Hitan is one of the most famous natural reserves in Egypt.',
      place: 'Fayoum, Egypt', dateOfInscription: 2005, criteria: 'VIII',
      property: '20,015 Ha', bufferZone: '3,805 Ha', dossier: 1186,
      ticketPrice: 100, fee: 100, category: 'Historical', status: 'Active'
    },
    {
      id: 2, name: 'Wadi El Rayan Waterfalls', location: 'Fayoum, Egypt',
      rating: 5,
      images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=500&fit=crop',
      ],
      description: 'Wadi El Rayan is a protected area featuring the only natural waterfalls in Egypt. The area includes two lakes connected by a waterfall and is home to diverse wildlife.',
      place: 'Fayoum, Egypt', dateOfInscription: 2003, criteria: 'VII',
      property: '18,000 Ha', bufferZone: '2,500 Ha', dossier: 1050,
      ticketPrice: 80, fee: 80, category: 'Nature', status: 'Active'
    },
    {
      id: 3, name: 'Lake Qarun', location: 'Fayoum, Egypt',
      rating: 4,
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=500&fit=crop',
        'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=500&fit=crop',
      ],
      description: 'Lake Qarun is one of Egypt\'s oldest natural lakes and a protected area. It is a haven for migratory birds and offers stunning views of the surrounding desert landscape.',
      place: 'Fayoum, Egypt', dateOfInscription: 1989, criteria: 'IX',
      property: '25,000 Ha', bufferZone: '4,200 Ha', dossier: 980,
      ticketPrice: 50, fee: 50, category: 'Nature', status: 'Active'
    }
  ];

  getAll(): Attraction[] { return this.attractions; }
  getById(id: number): Attraction | undefined { return this.attractions.find(a => a.id === id); }

  add(a: Omit<Attraction, 'id'>): void {
    const newId = Math.max(...this.attractions.map(x => x.id)) + 1;
    this.attractions.push({ ...a, id: newId });
  }

  update(id: number, data: Partial<Attraction>): void {
    const i = this.attractions.findIndex(a => a.id === id);
    if (i !== -1) this.attractions[i] = { ...this.attractions[i], ...data };
  }

  delete(id: number): void {
    this.attractions = this.attractions.filter(a => a.id !== id);
  }
}