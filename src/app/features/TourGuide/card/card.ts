import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface TourGuide {
  id: number;
  name: string;
  rating: number;
  description: string;
  image: string;
  isFavorite: boolean;
  email: string;
  phone: string;
  languages: string[];
  aboutMe: string;
}

@Component({
  selector: 'app-tour-guide-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './card.html',
})
export class Card {
  searchQuery = '';
  isPopupOpen = false;
  selectedGuide: TourGuide | null = null;

  guides: TourGuide[] = [
    {
      id: 1,
      name: 'Mariam Mahmoud Yousif',
      rating: 4.8,
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec enim euismod diam.',
      image: 'https://i.pravatar.cc/300?img=47',
      isFavorite: true,
      email: 'Mariammyousiff9@gmail.com',
      phone: '+20 1045983677',
      languages: ['English', 'Arabic', 'French'],
      aboutMe: "I am a passionate and licensed tour guide with over 6 years of experience leading travelers through Egypt's most iconic historical and cultural sites. My goal is to create unforgettable experiences.",
    },
    {
      id: 2,
      name: 'Nattaya Wong',
      rating: 4.5,
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec enim euismod diam.',
      image: 'https://i.pravatar.cc/300?img=11',
      isFavorite: false,
      email: 'nattaya@gmail.com',
      phone: '+20 1012345678',
      languages: ['English', 'Thai'],
      aboutMe: 'Experienced guide specializing in cultural and historical tours across Egypt with 4 years of experience.',
    },
    {
      id: 3,
      name: 'Somchai Prasert',
      rating: 4.1,
      description: 'Lorem ipsum dolor sit amet consectetur. Vitae aliquam parturient non integer sed euismod. Aliquam et magna cras donec enim euismod diam.',
      image: 'https://i.pravatar.cc/300?img=53',
      isFavorite: false,
      email: 'somchai@gmail.com',
      phone: '+20 1098765432',
      languages: ['English', 'Arabic'],
      aboutMe: 'Friendly and knowledgeable guide with deep passion for Egyptian history and warm atmosphere for every visitor.',
    },
  ];

  toggleFavorite(guide: TourGuide): void {
    guide.isFavorite = !guide.isFavorite;
  }

  openPopup(guide: TourGuide): void {
    this.selectedGuide = guide;
    this.isPopupOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.selectedGuide = null;
    document.body.style.overflow = 'auto';
  }
}
