import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from './hotel.service';
import { RestaurantService } from './resturant.service';
import { TourGuideService } from './tour-guide.service';
import { AttractionService } from './attraction.service'; // ✅ أضفناه

export interface SearchResult {
  id:       number;
  name:     string;
  subtitle: string;
  image:    string;
  type:     'hotel' | 'restaurant' | 'attraction' | 'tourGuide';
  route:    string;
}

// شكل الـ object الراجع من GET /hotels (نفس اللي بيتحط في hotelsListSubject)
interface HotelListItem {
  id:           number;
  name:         string;
  description:  string;
  location:     string;
  rating:       number;
  minPrice:     number;
  maxPrice:     number;
  mainImageUrl: string;
}

// نتيجة وسيطة بنحتفظ فيها بالـ score الداخلي قبل ما نرجعها للـ component
interface ScoredResult extends SearchResult {
  score: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {

  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  results$: Observable<SearchResult[]>;

  private openSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.openSubject.asObservable();

  constructor(
    private hotelService:      HotelService,
    private restaurantService: RestaurantService,
    private tourGuideService:  TourGuideService,
    private attractionService: AttractionService,    // ✅ أضفناه
  ) {
    this.results$ = combineLatest([
      this.query$.pipe(debounceTime(200), distinctUntilChanged()),
      this.hotelService.getHotelsList(),               // ✅ الداتا الحقيقية من الـ API (مش الـ mock)
      this.restaurantService.getRestaurants(),
      this.attractionService.getAll(),                 // ✅ أضفناه
      this.tourGuideService.getAll(),
    ]).pipe(
      map(([query, hotels, restaurants, attractions, guides]) => {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 1) return [];

        // ── Hotels ────────────────────────────────────────
        const hotelResults: ScoredResult[] = (hotels as HotelListItem[])
          .map((h): ScoredResult | null => {
            const score = this.computeScore(q, h.name, [h.location, h.description]);
            return score > 0
              ? {
                  id:       h.id,
                  name:     h.name,
                  subtitle: h.location,
                  image:    h.mainImageUrl,
                  type:     'hotel',
                  route:    `/hotels/details/${h.id}`,
                  score,
                }
              : null;
          })
          .filter((r): r is ScoredResult => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        // ── Restaurants ───────────────────────────────────
        const restaurantResults: ScoredResult[] = restaurants
          .map((r): ScoredResult | null => {
            const score = this.computeScore(q, r.name, [r.cuisine, r.location, r.description]);
            return score > 0
              ? {
                  id:       r.id,
                  name:     r.name,
                  subtitle: r.cuisine,
                  image:    r.images[0],
                  type:     'restaurant',
                  route:    `/restaurant/details/${r.id}`,
                  score,
                }
              : null;
          })
          .filter((r): r is ScoredResult => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        // ── Attractions ───────────────────────────────────  ✅
        const attractionResults: ScoredResult[] = attractions
          .map((a): ScoredResult | null => {
            const score = this.computeScore(q, a.name, [a.category, a.description]);
            return score > 0
              ? {
                  id:       a.id,
                  name:     a.name,
                  subtitle: a.category,
                  image:    a.mainImageUrl ?? '',
                  type:     'attraction',
                  route:    `/Attractions/${a.id}`,
                  score,
                }
              : null;
          })
          .filter((r): r is ScoredResult => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        // ── Tour Guides ───────────────────────────────────
        const guideResults: ScoredResult[] = guides
          .map((g): ScoredResult | null => {
            const score = this.computeScore(q, g.name, [g.description]);
            return score > 0
              ? {
                  id:       g.id,
                  name:     g.name,
                  subtitle: `${g.pricePerDay} LE / day`,
                  image:    g.profilePictureUrl,
                  type:     'tourGuide',
                  route:    `/tour-guide`,             // بيروح لصفحة التور جايد
                  score,
                }
              : null;
          })
          .filter((r): r is ScoredResult => r !== null)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        // كل category لوحده بالترتيب: هوتيلز → مطاعم → أتراكشنز → تور جايدز
        // وجوه كل category مرتب بالـ relevance
        return [...hotelResults, ...restaurantResults, ...attractionResults, ...guideResults]
          .map(({ score, ...rest }) => rest); // نشيل الـ score قبل الرجوع
      })
    );
  }

  /**
   * بيحسب score للنتيجة حسب مكان وشكل التطابق:
   *  - الاسم بيبدأ بالكلمة المكتوبة                    → أعلى أولوية (100)
   *  - الاسم فيه الكلمة كـ "كلمة كاملة" (word boundary) → أولوية عالية  (80)
   *  - الاسم فيه substring بس                          → أولوية متوسطة (50)
   *  - مفيش تطابق في الاسم، بس فيه تطابق في subtitle/description → أولوية منخفضة (20)
   *  - مفيش تطابق خالص → 0 (يعني يتشال من النتائج)
   */
  private computeScore(query: string, name: string, otherFields: (string | undefined | null)[]): number {
    const n = (name ?? '').toLowerCase();

    if (n.startsWith(query)) return 100;

    // تطابق كلمة كاملة جوه الاسم (مثلاً "hotel" جوه "Tunis Pyramids Hotel")
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(query)}\\b`, 'i');
    if (wordBoundaryRegex.test(n)) return 80;

    if (n.includes(query)) return 50;

    // لو مفيش تطابق في الاسم، نشوف باقي الحقول (location, cuisine, category, description...)
    const matchesOtherField = otherFields
      .filter((f): f is string => !!f)
      .some(f => f.toLowerCase().includes(query));

    return matchesOtherField ? 20 : 0;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  setQuery(query: string): void {
    this.querySubject.next(query);
    this.openSubject.next(query.trim().length > 0);
  }

  close(): void  { this.openSubject.next(false); }
  clear(): void  { this.querySubject.next(''); this.openSubject.next(false); }

  typeLabel(type: SearchResult['type']): string {
    return {
      hotel:       '🏨 Hotel',
      restaurant:  '🍽 Restaurant',
      attraction:  '🏛 Attraction',
      tourGuide:   '🧭 Tour Guide',
    }[type];
  }
}