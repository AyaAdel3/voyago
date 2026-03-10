import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Details } from '../details/details';

export interface TourGuide {
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
}

@Component({
  selector: 'app-tour-guide-card',
  standalone: true,
  imports: [CommonModule, Details],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit {
  guides: TourGuide[] = [];
  loading = true;
  selectedGuide: TourGuide | null = null;

  ngOnInit(): void {
    this.guides = [
      { id: 1, name: 'Araya Smith', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=400&fit=crop', rating: 4.8, languages: ['English', 'Arabic'], email: 'araya.smith@gmail.com', phone: '+20 1012345678', pricePerDay: 150, description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh.', liked: false },
      { id: 2, name: 'Nattaya Wong', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop', rating: 4.5, languages: ['English', 'French'], email: 'nattaya.wong@gmail.com', phone: '+20 1098765432', pricePerDay: 120, description: 'Lorem ipsum dolor sit amet consectetur. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh.', liked: false },
      { id: 3, name: 'Somchai Prasert', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop', rating: 4.1, languages: ['English', 'Arabic', 'French'], email: 'somchai.p@gmail.com', phone: '+20 1123456789', pricePerDay: 100, description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec.', liked: false },
      { id: 4, name: 'Miriam Hassan', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop', rating: 4.9, languages: ['English', 'Arabic', 'German'], email: 'miriam.hassan@gmail.com', phone: '+20 1056789012', pricePerDay: 180, description: 'A passionate and licensed tour guide with over 6 years of experience leading travelers through Egypt\'s most iconic historical and cultural sites.', liked: false },
      { id: 5, name: 'Mariam Mahmoud', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop', rating: 4.7, languages: ['English', 'Arabic', 'French'], email: 'mariammyousiff9@gmail.com', phone: '+20 1045983677', pricePerDay: 150, description: 'I am a passionate and licensed tour guide with over 6 years of experience leading travelers through Egypt\'s most iconic historical and cultural sites.', liked: false }
    ];
    this.loading = false;
  }

  toggleFav(event: MouseEvent, guide: TourGuide): void {
    event.stopPropagation();
    guide.liked = !guide.liked;
  }

  openDetails(guide: TourGuide): void {
    this.selectedGuide = guide;
  }

  closeDetails(): void {
    this.selectedGuide = null;
  }
}