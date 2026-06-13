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
  minPrice:    number;
  maxPrice:    number;
  location:    string;
  description: string;
  images:      string[];
  amenities:   string[];
  openTime:    string;
  closeTime:   string;
  isFavorite?: boolean;
  status?:     'Active' | 'Inactive';
  tables?:     RestaurantTables;
  featureIds?: number[];
  features?:   Feature[];
}

export interface RestaurantApiResponse {
  id:           number;
  name:         string;
  description:  string;
  rating:       number;
  cuisineType:  string;
  minPrice:     number;
  maxPrice:     number;
  mainImageUrl: string;
}

export interface RestaurantImageApi {
  id:       number;
  imageUrl: string;
  isMain:   boolean;
}

export interface RestaurantDetailApiResponse {
  id:            number;
  name:          string;
  description:   string;
  address:       string;
  rating:        number;
  cuisineType:   string;
  minPrice:      number;
  maxPrice:      number;
  tablesForTwo:  number;
  tablesForFour: number;
  tablesForSix:  number;
  images:        RestaurantImageApi[];
  features:      Feature[];
  comments:      RestaurantReview[];
  status?:       'Active' | 'Inactive';
  statusId?:     number;
}

export interface AdminRestaurantApiItem {
  id:           number;
  name:         string;
  cuisineType:  string;
  rating:       number;
  priceRange:   string;
  status:       'Active' | 'Inactive';
  totalTables:  number;
  mainImageUrl: string | null;
}

export interface AdminRestaurantsApiResponse {
  totalRestaurants:    number;
  activeRestaurants:   number;
  inactiveRestaurants: number;
  restaurants:         AdminRestaurantApiItem[];
}

export interface CuisineType {
  id:   number;
  name: string;
}

export const RESTAURANT_STATUSES = [
  { id: 1, name: 'Active'   },
  { id: 2, name: 'Inactive' },
];

export interface AdminRestaurantAddRequest {
  name:          string;
  description:   string;
  address:       string;
  rating:        number;
  cuisineType:   number;
  minPrice:      number;
  maxPrice:      number;
  tablesForTwo:  number;
  tablesForFour: number;
  tablesForSix:  number;
  featureIds:    number[];
}

export interface AdminRestaurantUpdateRequest {
  name:          string;
  description:   string;
  address:       string;
  rating:        number;
  cuisineType:   number;
  minPrice:      number;
  maxPrice:      number;
  tablesForTwo:  number;
  tablesForFour: number;
  tablesForSix:  number;
  status:        number;
  featureIds:    number[];
}

export interface RestaurantReview {
  id:           number;
  restaurantId: number;
  userName:     string;
  userCountry:  string;
  userAvatar?:  string;
  rating:       number;
  content:      string;
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

export interface AdminReviewComment {
  id:                number;
  userName:          string;
  profilePictureUrl: string | null;
  content:           string;
  rating:            number;
  createdAt:         string;
}

export interface AdminReviewsApiResponse {
  totalComments: number;
  averageRating: number;
  comments:      AdminReviewComment[];
}