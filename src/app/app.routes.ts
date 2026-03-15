import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';
import { Home } from './features/home/home';
import { Card as HotelCard } from './features/Hotel/card/card';
import { Details as HotelDetails } from './features/Hotel/details/details';
import { Booking as HotelBooking } from './features/Hotel/booking/booking';
import { BookingConfirmed as HotelBookingConfirmed } from './features/Hotel/booking-confirmed/booking-confirmed';
import { Card as RestaurantCard } from './features/Restaurant/card/card';
import { Details as RestaurantDetails } from './features/Restaurant/details/details';
import { Reservation } from './features/Restaurant/reservation/reservation';
import { Card } from './features/TourGuide/card/card';
import { TouristAttractionCard } from './features/TouristAttraction/card/card';
import { TouristAttractionDetails } from './features/TouristAttraction/details/details';
import { Main as BudgetMain } from './features/BudgetPlanning/main/main';
import { Plan } from './features/BudgetPlanning/plan/plan';
import { Details as BudgetDetails } from './features/BudgetPlanning/details/details';
import { FavoritesComponent } from './features/profile/favorites/favorites'; 
import { PersonalInformation } from './features/profile/personal-information/personal-information';
import { SavedPlanComponent } from './features/profile/saved-plan/saved-plan';
import { NotFound } from './features/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home, title: 'Home' },
      {
        path: 'hotels',
        children: [
          { path: '', component: HotelCard, title: 'Hotels' },
          { path: 'details/:id', component: HotelDetails, title: 'Hotel Details' },
          { path: 'booking', component: HotelBooking, title: 'Hotel Booking' },
          { path: 'booking-confirmed', component: HotelBookingConfirmed, title: 'Booking Confirmed' },
        ]
      },
      { path: 'Restaurants', component: RestaurantCard, title: 'Restaurants' },
      { path: 'restaurant/details/:id', component: RestaurantDetails, title: 'Restaurant Details' },
      { path: 'restaurant/reservation/:id', component: Reservation, title: 'Restaurant Reservation' },
      { path: 'tour-guide', component: Card, title: 'Tour Guides' },
      { path: 'Attractions', component: TouristAttractionCard, title: 'Tourist Attractions' },
      { path: 'tourist-attraction/details/:id', component: TouristAttractionDetails, title: 'Tourist Attraction Details' },
      { path: 'Budget Planning', component: BudgetMain, title: 'Budget Planning' },
      { path: 'budget-planning/plan', component: Plan, title: 'Create Plan' },
      { path: 'budget-planning/details/:id', component: BudgetDetails, title: 'Budget Details' },
      { path: 'profile/personal-information', component: PersonalInformation, title: 'Personal Information' },
      { path: 'profile/favorites', component: FavoritesComponent, title: 'My Favorites' }, 
      { path: 'profile/saved-plan', component: SavedPlanComponent, title: 'Saved Plans' },
      { path: '**', component: NotFound, title: 'Page Not Found' },
    ],
  },
];