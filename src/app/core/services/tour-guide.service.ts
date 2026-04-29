import { Injectable } from '@angular/core';

export type TourGuide = {
  id: number;
  name: string;
  image: string;
  rating: number;
  languages: string[];
  email: string;
  phone: string;
  pricePerDay: number;
  description: string;
  liked: boolean;
  tours: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class TourGuideService {

  private guides: TourGuide[] = [
    { id: 1, name: 'Araya Smith', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=400&fit=crop', rating: 4.8, languages: ['English', 'Arabic'], email: 'araya.smith@gmail.com', phone: '+20 1012345678', pricePerDay: 150, description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh.', liked: false, tours: 189, status: 'Active' },
    { id: 2, name: 'Nattaya Wong', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop', rating: 4.5, languages: ['English', 'French'], email: 'nattaya.wong@gmail.com', phone: '+20 1098765432', pricePerDay: 120, description: 'Lorem ipsum dolor sit amet consectetur. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh.', liked: false, tours: 245, status: 'Active' },
    { id: 3, name: 'Somchai Prasert', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop', rating: 4.1, languages: ['English', 'Arabic', 'French'], email: 'somchai.p@gmail.com', phone: '+20 1123456789', pricePerDay: 100, description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec.', liked: false, tours: 120, status: 'Active' },
  ];

  getAll(): TourGuide[] {
    return this.guides;
  }

  getActive(): TourGuide[] {
    return this.guides.filter(g => g.status === 'Active');
  }

  getById(id: number): TourGuide | undefined {
    return this.guides.find(g => g.id === id);
  }

  add(guide: Omit<TourGuide, 'id'>): void {
    const newId = Math.max(...this.guides.map(g => g.id)) + 1;
    this.guides.push({ ...guide, id: newId });
  }

  update(id: number, data: Partial<TourGuide>): void {
    const index = this.guides.findIndex(g => g.id === id);
    if (index !== -1) {
      this.guides[index] = { ...this.guides[index], ...data };
    }
  }

  delete(id: number): void {
    this.guides = this.guides.filter(g => g.id !== id);
  }

  toggleLike(id: number): void {
    const guide = this.guides.find(g => g.id === id);
    if (guide) guide.liked = !guide.liked;
  }
}