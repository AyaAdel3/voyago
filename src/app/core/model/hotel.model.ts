export interface HotelRooms {
  total:  number;
  single: number;
  double: number;
  triple: number;
  suite:  number;
}

export interface HotelDisplayFeature {
  icon: string;
  name: string;
}

export interface BookingFeatureDef {
  name:  string;
  price: number;
}

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
  status?: 'Active' | 'Inactive' | 'Blocked';
  rooms?: HotelRooms;
  displayFeatures?: HotelDisplayFeature[];
  displayFeatureIds?: number[];
  bookingFeatures?: BookingFeatureDef[];
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

export interface HotelFeatureDef {
  id:    number;
  name:  string;
  icon:  string;
  price: number;
}

export interface HotelFeature {
  name: string;
  price: number;
  selected: boolean;
  quantity: number;
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

export const BOARD_FEATURE_NAMES = ['Full Board', 'Half Board'];

// أسماء الـ features اللي دايما موجودة ومش ممكن تتحذف
export const FIXED_BOOKING_FEATURE_NAMES: string[] = ['Full Board', 'Half Board'];

// fallback لو هوتيل جديد (price = 0 الأدمن بيدخله)
export const FIXED_BOOKING_FEATURES: BookingFeatureDef[] = [
  { name: 'Full Board', price: 0 },
  { name: 'Half Board', price: 0 },
];

// للـ Booking Widget - بأسعار
export const MOCK_HOTEL_FEATURES: HotelFeatureDef[] = [
  { id: 1, name: 'Full Board',       icon: '🍽️', price: 150 },
  { id: 2, name: 'Half Board',       icon: '🥗',  price: 75  },
  { id: 3, name: 'Spa',              icon: '💆',  price: 50  },
  { id: 3, name: 'gym',              icon: '💆',  price: 100  },
  { id: 5, name: 'Airport Transfer', icon: '✈️',  price: 120 },
  
];

// للـ Display فقط (Great for your stay) - بدون أسعار
export const MOCK_DISPLAY_FEATURES: HotelFeatureDef[] = [
  { id: 1, name: 'WiFi',             icon: '📶', price: 0 },
  { id: 2, name: 'Pool',             icon: '🏊', price: 0 },
  { id: 3, name: 'Restaurant',       icon: '🍴', price: 0 },
  { id: 4, name: 'Spa',              icon: '💆', price: 0 },
  { id: 5, name: 'Airport Transfer', icon: '✈️', price: 0 },
  { id: 6, name: 'Garden',           icon: '🌿', price: 0 },
  { id: 7, name: 'Sun Terrace',      icon: '☀️', price: 0 },
  { id: 8, name: 'Lake View',        icon: '🌊', price: 0 },
  { id: 9, name: 'Private Pool',     icon: '🏊', price: 0 },
];

export const MOCK_HOTELS: Hotel[] = [
  {
    id: 1,
    name: 'House in tunis village',
    location: 'Tunis Village, 29000 Fayoum, Egypt',
    pricePerNight: 1500,
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
    displayFeatureIds: [1, 2, 3],
    displayFeatures: [
      { icon: '📶', name: 'WiFi'       },
      { icon: '🏊', name: 'Pool'       },
      { icon: '🍴', name: 'Restaurant' },
    ],
    bookingFeatures: [
      { name: 'Full Board', price: 150 },
      { name: 'Half Board', price: 75  },
      { name: 'spa', price: 50  },
      { name: 'gym', price: 100  },
    ],
    rooms: { total: 20, single: 8, double: 6, triple: 4, suite: 2 },
  },
  {
    id: 2,
    name: 'Tzila Lodge',
    location: 'Tunis Village, 29000 Fayoum, Egypt',
    pricePerNight: 150,
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
    displayFeatureIds: [1, 9, 6, 7],
    displayFeatures: [
      { icon: '📶', name: 'WiFi'         },
      { icon: '🏊', name: 'Private Pool' },
      { icon: '🌿', name: 'Garden'       },
      { icon: '☀️', name: 'Sun Terrace'  },
    ],
    bookingFeatures: [
      { name: 'Full Board', price: 150 },
      { name: 'Half Board', price: 75  },
      { name: 'Spa',        price: 50  },
    ],
    rooms: { total: 15, single: 5, double: 6, triple: 3, suite: 1 },
  },
  {
    id: 3,
    name: 'Desert Rose Resort',
    location: 'Qarun Lake, Fayoum, Egypt',
    pricePerNight: 150,
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
    displayFeatureIds: [1, 4, 3, 2, 8],
    displayFeatures: [
      { icon: '📶', name: 'WiFi'       },
      { icon: '💆', name: 'Spa'        },
      { icon: '🍴', name: 'Restaurant' },
      { icon: '🏊', name: 'Pool'       },
      { icon: '🌊', name: 'Lake View'  },
    ],
    bookingFeatures: [
      { name: 'Full Board',       price: 150 },
      { name: 'Half Board',       price: 75  },
      { name: 'Airport Transfer', price: 120 },
    ],
    rooms: { total: 30, single: 10, double: 10, triple: 5, suite: 5 },
  },
  {
    id: 3,
    name: 'Desert Rose Resort',
    location: 'Qarun Lake, Fayoum, Egypt',
    pricePerNight: 150,
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
    displayFeatureIds: [1, 4, 3, 2, 8],
    displayFeatures: [
      { icon: '📶', name: 'WiFi'       },
      { icon: '💆', name: 'Spa'        },
      { icon: '🍴', name: 'Restaurant' },
      { icon: '🏊', name: 'Pool'       },
      { icon: '🌊', name: 'Lake View'  },
    ],
    bookingFeatures: [
      { name: 'Full Board',       price: 150 },
      { name: 'Half Board',       price: 75  },
      { name: 'Airport Transfer', price: 120 },
    ],
    rooms: { total: 30, single: 10, double: 10, triple: 5, suite: 5 },
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

export function buildDefaultRooms(standardPrice: number): RoomType[] {
  return [
    { type: 'Standard', price: standardPrice,                    quantity: 0 },
    { type: 'Double',   price: Math.round(standardPrice * 1.5),  quantity: 0 },
    { type: 'Treble',   price: Math.round(standardPrice * 1.8),  quantity: 0 },
    { type: 'Suite',    price: standardPrice * 5,                quantity: 0 },
  ];
}

export const DEFAULT_ROOMS: RoomType[] = buildDefaultRooms(150);
export const DEFAULT_FEATURES: HotelFeature[] = [
  { name: 'Full Board', price: 150, selected: false, quantity: 0 },
  { name: 'Half Board', price: 75,  selected: false, quantity: 0 },
  { name: 'Spa',        price: 50,  selected: false, quantity: 0 },
];