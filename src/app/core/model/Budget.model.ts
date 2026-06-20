// ============================================================
// budget.model.ts  →  src/app/core/model/
// Interfaces مطابقة 100% لشكل الـ Backend API
// (BudgetPlanService.cs + Contracts/BudgetPlanning)
// ============================================================

// ── Request DTOs ───────────────────────────────────────────

export interface GetMinimumBudgetRequest {
  numberOfDays: number;
}

export interface SuggestBudgetPlanRequest {
  totalBudget: number;
  numberOfDays: number;
}

export interface SaveBudgetPlanRequest {
  totalBudget: number;
  numberOfDays: number;
  hotelId: number;
  restaurantIds: number[];
  attractionIds: number[];
}

// ── /budget-planning/minimum response ────────────────────────

export interface GetMinimumBudgetResponse {
  numberOfDays: number;
  minimumTotalBudget: number;
  minimumHotelBudget: number;
  minimumRestaurantBudget: number;
  minimumAttractionBudget: number;
}

// ── /budget-planning/suggest response ────────────────────────

export interface SuggestedHotelItem {
  id: number;
  name: string;
  location: string;
  rating: number;
  minPrice: number;
  estimatedTotalPrice: number;
  mainImageUrl: string | null;
}

export interface SuggestedRestaurantItem {
  id: number;
  name: string;
  address: string;
  rating: number;
  cuisineType: string;
  minPrice: number;
  maxPrice: number;
  estimatedPrice: number;
  mainImageUrl: string | null;
}

export interface SuggestedAttractionItem {
  id: number;
  name: string;
  location: string;
  rating: number;
  category: string;
  ticketPrice: number;
  mainImageUrl: string | null;
}

export interface SuggestBudgetPlanResponse {
  totalBudget: number;
  numberOfDays: number;
  hotelBudget: number;
  restaurantBudget: number;
  attractionBudget: number;
  suggestedHotels: SuggestedHotelItem[];
  suggestedRestaurants: SuggestedRestaurantItem[];
  suggestedAttractions: SuggestedAttractionItem[];
}

// ── /budget-planning/save (و GetUserPlansAsync) response ────

export interface BudgetPlanHotelItem {
  id: number;
  name: string;
  price: number;
  mainImageUrl: string | null;
}

export interface BudgetPlanRestaurantItem {
  id: number;
  name: string;
  estimatedPrice: number;
  mainImageUrl: string | null;
}

export interface BudgetPlanAttractionItem {
  id: number;
  name: string;
  ticketPrice: number;
  mainImageUrl: string | null;
}

export interface BudgetPlanResponse {
  id: number;
  totalBudget: number;
  numberOfDays: number;
  hotelBudget: number;
  restaurantBudget: number;
  attractionBudget: number;
  hotel: BudgetPlanHotelItem | null;
  restaurants: BudgetPlanRestaurantItem[];
  attractions: BudgetPlanAttractionItem[];
  totalHotelCost: number;
  totalRestaurantCost: number;
  totalAttractionCost: number;
  totalEstimatedCost: number;
  createdAt: string;
}

// ── Breakdown helper (مأخوذة مباشرة من response الباك) ───────

export interface BudgetBreakdown {
  hotelBudget: number;
  restaurantBudget: number;
  attractionBudget: number;
}