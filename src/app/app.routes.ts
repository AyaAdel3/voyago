import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';

// Home
import { Home } from './features/home/home';

// Hotel
import { Card as HotelCard } from './features/Hotel/card/card';
import { Details as HotelDetails } from './features/Hotel/details/details';
import { Booking as HotelBooking } from './features/Hotel/booking/booking';
import { BookingConfirmed as HotelBookingConfirmed } from './features/Hotel/booking-confirmed/booking-confirmed';

// Restaurant
import { Card as RestaurantCard } from './features/Restaurant/card/card';
import { Details as RestaurantDetails } from './features/Restaurant/details/details';
import { Reservation } from './features/Restaurant/reservation/reservation';

// TourGuide
import { Card } from './features/TourGuide/card/card';
import { Booking as TourGuideBooking } from './features/TourGuide/booking/booking';
import { BookingConfirmed as TourGuideBookingConfirmed } from './features/TourGuide/booking-confirmed/booking-confirmed';

// TouristAttraction
import { TouristAttractionCard } from './features/TouristAttraction/card/card';
import { TouristAttractionDetails } from './features/TouristAttraction/details/details';

// BudgetPlanning
import { Main as BudgetMain } from './features/BudgetPlanning/main/main';
import { Plan } from './features/BudgetPlanning/plan/plan';
import { Details as BudgetDetails } from './features/BudgetPlanning/details/details';

// Profile
import { FavoritesComponent } from './features/profile/favorites/favorites';
import { PersonalInformation } from './features/profile/personal-information/personal-information';
import { SavedPlanComponent } from './features/profile/saved-plan/saved-plan';

// Not Found
import { NotFound } from './features/not-found/not-found';

// Admin
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { Dashboard } from './features/admin/dashboard/dashboard/dashboard';
import { AdminHotels } from './features/admin/hotels/hotels/hotels';
import { ManageHotel } from './features/admin/hotels/manage-hotel/manage-hotel';
import { AdminRestaurants } from './features/admin/restaurants/restaurants/restaurants';
import { ManageRestaurant } from './features/admin/restaurants/manage-restaurant/manage-restaurant';
import { AdminAttractions } from './features/admin/attractions/attractions/attractions';
import { ManageAttraction } from './features/admin/attractions/manage-attraction/manage-attraction';
import { AdminTourGuides } from './features/admin/tour-guides/tour-guides/tour-guides';
import { ManageTourGuide } from './features/admin/tour-guides/manag-tour-guide/manag-tour-guide';
import { AdminUsers } from './features/admin/users/users/users';


export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      // Default
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Home
      { path: 'home', component: Home, title: 'Home' },

      // Hotel Routes
      {
        path: 'hotels',
        children: [
          { path: '', component: HotelCard, title: 'Hotels' },
          { path: 'details/:id', component: HotelDetails, title: 'Hotel Details', runGuardsAndResolvers: 'paramsChange' },
          { path: 'booking', component: HotelBooking, title: 'Hotel Booking' },
          { path: 'booking-confirmed', component: HotelBookingConfirmed, title: 'Booking Confirmed' },
        ]
      },

      // Restaurant Routes
      { path: 'Restaurants', component: RestaurantCard, title: 'Restaurants' },
      { path: 'restaurant/details/:id', component: RestaurantDetails, title: 'Restaurant Details' },
      { path: 'restaurant/reservation/:id', component: Reservation, title: 'Restaurant Reservation' },

      // TourGuide Routes
      { path: 'tour-guide', component: Card, title: 'Tour Guides' },
      { path: 'tour-guide/booking', component: TourGuideBooking, title: 'Tour Guide Booking' },
      { path: 'tour-guide/booking-confirmed', component: TourGuideBookingConfirmed, title: 'Tour Guide Booking Confirmed' },

      // TouristAttraction Routes
      { path: 'Attractions', component: TouristAttractionCard, title: 'Tourist Attractions' },
      { path: 'tourist-attraction/details/:id', component: TouristAttractionDetails, title: 'Tourist Attraction Details' },

      // BudgetPlanning Routes
      { path: 'Budget Planning', component: BudgetMain, title: 'Budget Planning' },
      { path: 'budget-planning/plan', component: Plan, title: 'Create Plan' },
      { path: 'budget-planning/details/:id', component: BudgetDetails, title: 'Budget Details' },

      // Profile Routes
      { path: 'profile', redirectTo: 'profile/personal-information', pathMatch: 'full' },
      { path: 'profile/personal-information', component: PersonalInformation, title: 'Personal Information' },
      { path: 'profile/favorites', component: FavoritesComponent, title: 'My Favorites' },
      { path: 'profile/saved-plan', component: SavedPlanComponent, title: 'Saved Plans' },
    ],
  },

  // Admin
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, title: 'Admin Dashboard' },

      // Hotels
      { path: 'hotels', component: AdminHotels, title: 'Manage Hotels' },
      { path: 'hotels/manage', component: ManageHotel, title: 'Hotel Form' },

      // Restaurants
      { path: 'restaurants', component: AdminRestaurants, title: 'Manage Restaurants' },
      { path: 'restaurants/manage', component: ManageRestaurant, title: 'Restaurant Form' },

      // Attractions
      { path: 'attractions', component: AdminAttractions, title: 'Manage Attractions' },
      { path: 'attractions/manage', component: ManageAttraction, title: 'Attraction Form' },

      // Tour Guides
      { path: 'tour-guides', component: AdminTourGuides, title: 'Manage Tour Guides' },
      { path: 'tour-guides/manage', component: ManageTourGuide, title: 'Tour Guide Form' },

      // Users
      { path: 'users', component: AdminUsers, title: 'Manage Users' },
    ],
  },

  // Not Found
  { path: '**', component: NotFound, title: 'Page Not Found' },
];