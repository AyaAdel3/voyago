import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-saved-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-plan.html',
  styleUrl: './saved-plan.css'
})
export class SavedPlanComponent implements OnInit {
  // ملاحظة: الاسم هنا SavedPlanComponent عشان يطابق الـ Routes
  
  myPlan = {
    hotel: {
      name: 'House in tunis village',
      location: 'Fayoum, Egypt',
      rating: 5.0,
      pricePerNight: 285,
      totalPrice: 1995,
      nights: 7,
      img: 'https://picsum.photos/seed/hotel1/800/400',
      features: ['Restaurant', 'private pool', 'WIFI']
    },
    restaurants: [
      { 
        name: 'Urban Palate', 
        rating: 4.8, 
        type: 'Traditional Catalan', 
        img: 'https://picsum.photos/seed/res1/400/300' 
      },
      { 
        name: 'The Modern Bite', 
        rating: 4.8, 
        type: 'Traditional Catalan', 
        img: 'https://picsum.photos/seed/res2/400/300' 
      },
      { 
        name: 'Social Table', 
        rating: 4.8, 
        type: 'Spanish Gastronomy', 
        img: 'https://picsum.photos/seed/res3/400/300' 
      }
    ],
    attractions: [
      { 
        name: 'Wadi El Hitan Area', 
        rating: 4.8, 
        desc: 'Fossil Of Whale Skeletons', 
        img: 'https://picsum.photos/seed/att1/400/300' 
      },
      { 
        name: 'Wadi El Rayan Waterfalls', 
        rating: 4.8, 
        desc: 'Recreational And Tourist Activities', 
        img: 'https://picsum.photos/seed/att2/400/300' 
      },
      { 
        name: 'Lake Qarun', 
        rating: 4.8, 
        desc: 'One Of The Largest Natural Lakes', 
        img: 'https://picsum.photos/seed/att3/400/300' 
      }
    ]
  };

  constructor() {}

  ngOnInit(): void {
    // هنا مستقبلاً هننادي على الـ Service عشان نسحب الداتا الحقيقية
  }
}