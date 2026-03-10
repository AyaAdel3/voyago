import { Component } from '@angular/core';
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
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, Details],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card {
  selectedGuide: TourGuide | null = null;

  guides: TourGuide[] = [
    {
      id: 1,
      name: 'Araya Smith',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 4.8,
      languages: ['English', 'Arabic'],
      email: 'araya.smith@gmail.com',
      phone: '+20 1012345678',
      pricePerDay: 150,
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta uma.',
      liked: true
    },
    {
      id: 2,
      name: 'Nattaya Wong',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 4.5,
      languages: ['English', 'French'],
      email: 'nattaya.wong@gmail.com',
      phone: '+20 1098765432',
      pricePerDay: 120,
      description: 'Lorem ipsum dolor sit amet consectetur. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta uma.',
      liked: false
    },
    {
      id: 3,
      name: 'Somchai Prasert',
      image: 'https://randomuser.me/api/portraits/men/75.jpg',
      rating: 4.1,
      languages: ['English', 'Arabic', 'French'],
      email: 'somchai.p@gmail.com',
      phone: '+20 1123456789',
      pricePerDay: 100,
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec. Enim euismod diam pellentesque dictum aenean massa lectus id nibh. Cras orci fames velit tincidunt. Ultrices iaculis lobortis accumsan semper non lectus bibendum porta uma.',
      liked: false
    },
    {
      id: 4,
      name: 'Miriam Hassan',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
      rating: 4.9,
      languages: ['English', 'Arabic', 'German'],
      email: 'miriam.hassan@gmail.com',
      phone: '+20 1056789012',
      pricePerDay: 180,
      description: 'A passionate and licensed tour guide with over 6 years of experience leading travelers through Egypt\'s most iconic historical and cultural sites. My goal is to create unforgettable experiences combining rich storytelling and deep historical knowledge.',
      liked: false
    },
    {
      id: 5,
      name: 'Mariam Mahmoud',
      image: 'https://randomuser.me/api/portraits/women/90.jpg',
      rating: 4.7,
      languages: ['English', 'Arabic', 'French'],
      email: 'mariammyousiff9@gmail.com',
      phone: '+20 1045983677',
      pricePerDay: 150,
      description: 'I am a passionate and licensed tour guide with over 6 years of experience leading travelers through Egypt\'s most iconic historical and cultural sites. My goal is to create unforgettable experiences by combining rich storytelling, deep historical knowledge, and a warm, friendly atmosphere for every visitor.',
      liked: false
    }
  ];

  toggleLike(guide: TourGuide): void {
    guide.liked = !guide.liked;
  }

  openDetails(guide: TourGuide): void {
    this.selectedGuide = guide;
  }

  closeDetails(): void {
    this.selectedGuide = null;
  }
}