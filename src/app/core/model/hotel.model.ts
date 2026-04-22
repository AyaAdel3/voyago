// ============================================================
// hotel.model.ts
// ============================================================

export interface Hotel {
  id: number;
  name: string;
  location: string;
  pricePerNight: number;
  originalPrice?: number;
  rating: number;
  description: string;
  images: string[];
  isFavorite?: boolean;
  amenities: string[];
  stars: number;
  status?: 'Active' | 'Inactive' | 'Blocked'; // ← مضافة
}

export interface Review {
  id: number;
  hotelId: number;
  userName: string;
  userAvatar: string;
  userCountry: string;
  rating: number;
  comment: string;
  date: string;
}

export interface RoomType {
  type: string;
  price: number;
  quantity: number;
}

export interface HotelFeature {
  name: string;
  price: number;
  selected: boolean;
}

export interface BookingData {
  hotelId: number;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  rooms: RoomType[];
  features: HotelFeature[];
  totalNights: number;
  discount: number;
  serviceCharge: number;
  totalAmount: number;
}

// ============================================================
// MOCK DATA
// ============================================================

export const MOCK_HOTELS: Hotel[] = [
  {
    id: 1,
    name: 'House in tunis village',
    location: 'Tunis Village, 29000 Fayoum, Egypt',
    pricePerNight: 1425,
    rating: 4.8,
    stars: 4,
    status: 'Active',
    description:
      'Comfortable accommodations in the heart of Tunis village. Enjoy family rooms with private bathrooms, balconies, and pool views. Each room includes air-conditioning, a sofa bed, and a refrigerator.',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
    ],
    amenities: ['WiFi', 'Pool', 'Restaurant'],
  },
  {
    id: 2,
    name: 'Tzila Lodge',
    location: 'Tunis Village, 29000 Fayoum, Egypt',
    pricePerNight: 310,
    originalPrice: 510,
    rating: 4.8,
    stars: 4,
    status: 'Active',
    description:
      'Exceptional facilities: guests enjoy a sun terrace, garden, and a year-round outdoor swimming pool.',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    ],
    amenities: ['WiFi', 'private pool', 'Restaurant'],
  },
  {
    id: 3,
    name: 'Desert Rose Resort',
    location: 'Qarun Lake, Fayoum, Egypt',
    pricePerNight: 850,
    rating: 4.5,
    stars: 5,
    status: 'Active',
    description:
      'Luxury desert retreat overlooking the enchanting Qarun Lake.',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    ],
    amenities: ['WiFi', 'Spa', 'Restaurant', 'Pool'],
  },
];

export const MOCK_REVIEWS: Review[] = [
  { id: 1, hotelId: 2, userName: 'Yara Morad',    userAvatar: '', userCountry: 'Roma',   rating: 4, comment: 'Amazing stay!', date: '2025-11-01' },
  { id: 2, hotelId: 2, userName: 'Amad Dialo',    userAvatar: '', userCountry: 'Gansa',  rating: 4, comment: 'Amazing stay!', date: '2025-10-20' },
  { id: 3, hotelId: 2, userName: 'Chae-min',      userAvatar: '', userCountry: 'Korean', rating: 4, comment: 'Amazing stay!', date: '2025-10-15' },
  { id: 4, hotelId: 2, userName: 'Mark Alec',     userAvatar: '', userCountry: 'Italy',  rating: 4, comment: 'Amazing stay!', date: '2025-10-10' },
  { id: 5, hotelId: 2, userName: 'Malak Mohamed', userAvatar: '', userCountry: 'Egypt',  rating: 4, comment: 'Amazing stay!', date: '2025-10-05' },
  { id: 6, hotelId: 2, userName: 'David Silva',   userAvatar: '', userCountry: 'Kenya',  rating: 4, comment: 'Amazing stay!', date: '2025-09-30' },
];

export const DEFAULT_ROOMS: RoomType[] = [
  { type: 'Standard', price: 150, quantity: 0 },
  { type: 'Double',   price: 75,  quantity: 0 },
  { type: 'Treble',   price: 50,  quantity: 0 },
  { type: 'Suite',    price: 750, quantity: 0 },
];

export const DEFAULT_FEATURES: HotelFeature[] = [
  { name: 'Full Board', price: 150, selected: false },
  { name: 'Half Board', price: 75,  selected: false },
  { name: 'Spa',        price: 50,  selected: false },
];