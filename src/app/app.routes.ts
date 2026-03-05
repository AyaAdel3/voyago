import { Routes } from '@angular/router';
import { MainLayout } from './core/layouts/main-layout/main-layout';

// Home
import { Home } from './features/home/home';

// Hotel
import { Card as HotelCard } from './features/Hotel/card/card';
import { Details as HotelDetails } from './features/Hotel/details/details';

// Restaurant
import { Card as RestaurantCard } from './features/Restaurant/card/card';
import { Details as RestaurantDetails } from './features/Restaurant/details/details';
import { Reservation } from './features/Restaurant/reservation/reservation';

// TourGuide
import { Card as TourGuideCard } from './features/TourGuide/card/card';
import { Details as TourGuideDetails } from './features/TourGuide/details/details';

// TouristAttraction
import { Card as TouristAttractionCard } from './features/TouristAttraction/card/card';
import { Details as TouristAttractionDetails } from './features/TouristAttraction/details/details';

// BudgetPlanning
import { Main as BudgetMain } from './features/BudgetPlanning/main/main';
import { Plan } from './features/BudgetPlanning/plan/plan';
import { Details as BudgetDetails } from './features/BudgetPlanning/details/details';

// Profile
import { Favorites } from './features/profile/favorites/favorites';
import { PersonalInformation } from './features/profile/personal-information/personal-information';
import { SavedPlan } from './features/profile/saved-plan/saved-plan';

// Not Found
import { NotFound } from './features/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      // Default
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Home
      { path: 'home', component: Home, title: 'Homepage' },

      // Hotel Routes
      { path: 'Hotels', component: HotelCard, title: 'Hotels' },
      { path: 'hotel/details/:id', component: HotelDetails, title: 'Hotel Details' },

      // Restaurant Routes
      { path: 'Restaurants', component: RestaurantCard, title: 'Restaurants' },
      { path: 'restaurant/details/:id', component: RestaurantDetails, title: 'Restaurant Details' },
      { path: 'restaurant/reservation/:id', component: Reservation, title: 'Restaurant Reservation' },

      // TourGuide Routes
      { path: 'Tour Guide', component: TourGuideCard, title: 'Tour Guides' },
      { path: 'tour-guide/details/:id', component: TourGuideDetails, title: 'Tour Guide Details' },

      // TouristAttraction Routes
      { path: 'Attractions', component: TouristAttractionCard, title: 'Tourist Attractions' },
      { path: 'tourist-attraction/details/:id', component: TouristAttractionDetails, title: 'Tourist Attraction Details' },

      // BudgetPlanning Routes
      { path: 'Budget Planning', component: BudgetMain, title: 'Budget Planning' },
      { path: 'budget-planning/plan', component: Plan, title: 'Create Plan' },
      { path: 'budget-planning/details/:id', component: BudgetDetails, title: 'Budget Details' },

      // Profile Routes
      { path: 'profile/favorites', component: Favorites, title: 'My Favorites' },
      { path: 'profile/personal-information', component: PersonalInformation, title: 'Personal Information' },
      { path: 'profile/saved-plan', component: SavedPlan, title: 'Saved Plans' },

      // Not Found
      { path: '**', component: NotFound, title: 'Page Not Found' },
    ],
  },
];