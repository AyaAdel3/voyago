// ============================================================
// budget.model.ts  →  src/app/core/model/
// كل الـ interfaces والـ mock data بتاعة الـ Budget Planning
// ============================================================

import { Hotel, MOCK_HOTELS } from './hotel.model';
import { Restaurant } from './restaurant.model';

// ── Tourist Attraction ────────────────────────────────────
export interface Attraction {
  id:          number;
  name:        string;
  rating:      number;
  category:    string;   // "Fossil Site", "Waterfall", "Lake"...
  description: string;
  entryFee:    number;   // 0 = مجاني
  images:      string[];
  location:    string;
}

// ── Budget Plan (المخطط المحفوظ) ──────────────────────────
export interface BudgetPlan {
  id:              number;
  totalBudget:     number;
  days:            number;
  dailyBudget:     number;
  selectedHotel:   Hotel   | null;
  selectedRestaurants: Restaurant[];
  selectedAttractions: Attraction[];
  totalCost:       number;
  createdAt:       string;
}

// ── Budget Breakdown ──────────────────────────────────────
export interface BudgetBreakdown {
  hotelBudget:      number;  // 50% من الـ total
  restaurantBudget: number;  // 30%
  attractionBudget: number;  // 20%
}

// ════════════════════════════════════════════════════════
// MOCK ATTRACTIONS
// ════════════════════════════════════════════════════════
export const MOCK_ATTRACTIONS: Attraction[] = [
  {
    id: 1,
    name: 'Wadi El Hitan Area',
    rating: 4.8,
    category: 'Fossil Of Whale Skeletons',
    description: 'Lorem Ipsum Dolor Sit Amet Consectetur. Vitae Aliquam Parturient Non Integer Sed Euismod. Aliquam Et Magna Cras Donec.',
    entryFee: 100,
    location: 'Fayoum',
    images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600'],
  },
  {
    id: 2,
    name: 'Wadi El Rayan Waterfalls',
    rating: 4.8,
    category: 'Recreational And Tourist Activities',
    description: 'Lorem Ipsum Dolor Sit Amet Consectetur. Vitae Aliquam Parturient Non Integer Sed Euismod. Aliquam Et Magna Cras Donec.',
    entryFee: 50,
    location: 'Fayoum',
    images: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600'],
  },
  {
    id: 3,
    name: 'Lake Qarun',
    rating: 4.8,
    category: 'One Of The Largest Natural Lakes',
    description: 'Lorem Ipsum Dolor Sit Amet Consectetur. Vitae Aliquam Parturient Non Integer Sed Euismod. Aliquam Et Magna Cras Donec.',
    entryFee: 0,
    location: 'Fayoum',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'],
  },
  {
    id: 4,
    name: 'Fayoum Oasis',
    rating: 4.7,
    category: 'Natural Oasis',
    description: 'Lorem Ipsum Dolor Sit Amet Consectetur. Vitae Aliquam Parturient Non Integer Sed Euismod.',
    entryFee: 0,
    location: 'Fayoum',
    images: ['https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600'],
  },
];

// re-export عشان نستخدم نفس البيانات الموجودة
export { MOCK_HOTELS };