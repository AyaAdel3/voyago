export interface RestaurantTables {
  total: number;
  for2:  number;
  for4:  number;
  for6:  number;
}

export interface Feature {
  id:   number;
  name: string;
  icon: string;
}

export interface Restaurant {
  id:          number;
  name:        string;
  rating:      number;
  stars:       number;
  cuisine:     string;
  priceRange:  string;
  address:     string;
  location:    string;
  description: string;
  images:      string[];
  amenities:   string[];
  openTime:    string;
  closeTime:   string;
  isFavorite?: boolean;
  status?:     'Active' | 'Inactive' | 'Blocked';
  tables?:     RestaurantTables;
  featureIds?: number[];   // الـ IDs اللي بتتبعت للـ API
}

export interface RestaurantReview {
  id:           number;
  restaurantId: number;
  userName:     string;
  userCountry:  string;
  userAvatar?:  string;
  rating:       number;
  comment:      string;
  date:         string;
}

export interface TableType {
  type:     string;
  capacity: number;
  price:    number;
  quantity: number;
}

export interface ReservationData {
  restaurantId:      number;
  restaurantName:    string;
  restaurantAddress: string;
  date:              string;
  time:              string;
  guestCount:        number;
  tables:            TableType[];
  guestName:         string;
  phone:             string;
  totalAmount:       number;
}

// ── Mock Features (سيتعوضوا بـ API call) ─────────────────
export const MOCK_FEATURES: Feature[] = [
  { id: 1, name: 'Parking',          icon: '🅿️' },
  { id: 2, name: 'WiFi',             icon: '📶' },
  { id: 3, name: 'Smoking Allowed',  icon: '🚬' },
  { id: 4, name: 'Outdoor Seating',  icon: '🪑' },
  { id: 5, name: 'Lake View',        icon: '🌊' },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id:          1,
    name:        'Aura',
    rating:      4.8,
    stars:       4,
    cuisine:     'Fine Dining',
    priceRange:  '150-500LE',
    address:     'Four Seasons Hotel At The First Residence, Giza Governate',
    location:    'Giza Governate',
    status:      'Active',
    description: 'Aura, Located At The Four Seasons Hotel, Is A Traditional Lebanese Restaurant. Though The Poolside Views Of The City And The Smell Of Fresh Bread Baking In The Brick Oven Are Enticing, The Real Star Of Aura Is The Modern Shami Cuisine.',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    ],
    amenities:  ['Valet parking is available.', 'Smoking is allowed'],
    featureIds: [1, 3],
    openTime:   '12:00',
    closeTime:  '23:00',
    tables: { total: 20, for2: 8, for4: 8, for6: 4 },
  },
  {
    id:          2,
    name:        'House in Tunis Village',
    rating:      4.8,
    stars:       5,
    cuisine:     'Egyptian',
    priceRange:  '100-300LE',
    address:     'Tunis Village, Fayoum, Egypt',
    location:    'Fayoum',
    status:      'Active',
    description: 'Traditional Egyptian cuisine in the heart of Tunis village with stunning lake views.',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
    ],
    amenities:  ['Free Parking', 'Outdoor Seating'],
    featureIds: [1, 4, 5],
    openTime:   '09:00',
    closeTime:  '22:00',
    tables: { total: 15, for2: 6, for4: 6, for6: 3 },
  },
  {
    id:          3,
    name:        'Mediterranean Garden',
    rating:      4.8,
    stars:       4,
    cuisine:     'Mediterranean',
    priceRange:  '200-600LE',
    address:     'Tunis Village, Fayoum, Egypt',
    location:    'Fayoum',
    status:      'Active',
    description: 'Fresh Mediterranean dishes with garden seating and lake views.',
    images: [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    ],
    amenities:  ['WiFi', 'Live Music'],
    featureIds: [2, 4],
    openTime:   '13:00',
    closeTime:  '00:00',
    tables: { total: 12, for2: 4, for4: 6, for6: 2 },
  },
  
];

export const MOCK_RESTAURANT_REVIEWS: RestaurantReview[] = [
  { id:1, restaurantId:1, userName:'Yara Morad',    userCountry:'Egypt',  rating:5, comment:'Amazing food and atmosphere!', date:'2025-01-10' },
  { id:2, restaurantId:1, userName:'Amad Dialo',    userCountry:'Garaa',  rating:4, comment:'Great experience overall.',     date:'2025-01-12' },
  { id:3, restaurantId:1, userName:'Chae-min',      userCountry:'Korean', rating:4, comment:'Loved the Lebanese cuisine.',   date:'2025-01-15' },
  { id:4, restaurantId:1, userName:'Mark Alec',     userCountry:'Italy',  rating:4, comment:'Will definitely come back.',   date:'2025-01-18' },
  { id:5, restaurantId:1, userName:'Malak Mohamed', userCountry:'Egypt',  rating:5, comment:'Best restaurant in Cairo.',    date:'2025-01-20' },
  { id:6, restaurantId:1, userName:'David Silva',   userCountry:'Kenya',  rating:4, comment:'Fantastic views and food.',    date:'2025-01-22' },
];

export const DEFAULT_TABLES: TableType[] = [
  { type: 'Table For 2', capacity: 2, price: 0, quantity: 0 },
  { type: 'Table For 4', capacity: 4, price: 0, quantity: 0 },
  { type: 'Table For 6', capacity: 6, price: 0, quantity: 0 },
];

export const AVAILABLE_TIMES: string[] = [
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];