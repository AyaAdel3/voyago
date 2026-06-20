import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from './hotel.service';
import { RestaurantService } from './resturant.service';
import { TourGuideService } from './tour-guide.service';
import { AttractionService } from './attraction.service';

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

// ── Type Mode ────────────────────────────────────────────────
// لو الكويري بادئة بكلمة من الكلمات دي، يدخل "type mode": يظهر بس النوع
// المطلوب، ومفلتر بالاسم فاضل شغال جوه النوع ده بس.
// بنرتبهم من الأطول للأقصر عشان "tour guide" تتفحص قبل أي تطابق جزئي.
const TYPE_KEYWORDS: { keyword: string; type: SearchResult['type'] }[] = [
  { keyword: 'tour guide', type: 'tourGuide'  },
  { keyword: 'restaurant', type: 'restaurant' },
  { keyword: 'attraction', type: 'attraction' },
  { keyword: 'hotel',      type: 'hotel'      },
];

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
    private attractionService: AttractionService,
  ) {
    this.results$ = combineLatest([
      this.query$.pipe(debounceTime(200), distinctUntilChanged()),
      this.hotelService.getHotelsList(),               // الداتا الحقيقية من الـ API (مش الـ mock)
      this.restaurantService.getRestaurants(),
      this.attractionService.getAll(),
      this.tourGuideService.getAll(),
    ]).pipe(
      map(([query, hotels, restaurants, attractions, guides]) => {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 1) return [];

        // ── Type Mode Detection ──────────────────────────
        // لو الكويري بادئة بـ "hotel" / "restaurant" / "tour guide" / "attraction"،
        // نرجع بس النوع ده (مفلتر كمان بالاسم لو فيه حروف زيادة بعد الكلمة).
        const matchedType = TYPE_KEYWORDS.find(t => q.startsWith(t.keyword));

        if (matchedType) {
          return this.getResultsForType(matchedType.type, q, {
            hotels, restaurants, attractions, guides,
          });
        }

        // ── Normal Search (relevance scoring across all categories) ──
        const hotelResults      = this.scoreHotels(q, hotels as HotelListItem[]);
        const restaurantResults = this.scoreRestaurants(q, restaurants);
        const attractionResults = this.scoreAttractions(q, attractions);
        const guideResults      = this.scoreGuides(q, guides);

        // كل category لوحده بالترتيب: هوتيلز → مطاعم → أتراكشنز → تور جايدز
        // وجوه كل category مرتب بالـ relevance
        return [...hotelResults, ...restaurantResults, ...attractionResults, ...guideResults]
          .map(({ score, ...rest }) => rest); // نشيل الـ score قبل الرجوع
      })
    );
  }

  /**
   * لما يكون فيه type keyword في أول الكويري، بنرجع بس النوع ده.
   * بنشيل الـ keyword من الكويري قبل الفلترة عشان لو فيه حروف زيادة
   * بعده (مثلاً "hotel fayoum") تتفلتر صح على الاسم.
   */
  private getResultsForType(
    type:  SearchResult['type'],
    query: string,
    data: {
      hotels:      any[];
      restaurants: any[];
      attractions: any[];
      guides:      any[];
    },
  ): SearchResult[] {
    const keyword    = TYPE_KEYWORDS.find(t => t.type === type)!.keyword;
    const restOfQuery = query.slice(keyword.length).trim();

    let results: ScoredResult[];

    switch (type) {
      case 'hotel':
        results = this.scoreHotels(restOfQuery, data.hotels as HotelListItem[], true);
        break;
      case 'restaurant':
        results = this.scoreRestaurants(restOfQuery, data.restaurants, true);
        break;
      case 'attraction':
        results = this.scoreAttractions(restOfQuery, data.attractions, true);
        break;
      case 'tourGuide':
        results = this.scoreGuides(restOfQuery, data.guides, true);
        break;
      default:
        results = [];
    }

    return results.map(({ score, ...rest }) => rest);
  }

  // ════════════════════════════════════════════════════════
  // SCORING PER CATEGORY
  // كل دالة بترجع النتائج المرتبة بالـ relevance لنوع واحد.
  // الـ unlimited flag: في "type mode" منرجع أكتر من 3 نتائج
  // (يعني كل الهوتيلز مثلاً)، أما في normal search بنحدد بـ 3.
  // ════════════════════════════════════════════════════════

  private scoreHotels(query: string, hotels: HotelListItem[], unlimited = false): ScoredResult[] {
    const results = hotels
      .map((h): ScoredResult | null => {
        const score = query
          ? this.computeScore(query, h.name, [h.location, h.description])
          : 100; // لو الكويري فاضية بعد شيل الـ keyword، يطلع كل الهوتيلز
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
      .sort((a, b) => b.score - a.score);

    return unlimited ? results : results.slice(0, 3);
  }

  private scoreRestaurants(query: string, restaurants: any[], unlimited = false): ScoredResult[] {
    const results = restaurants
      .map((r): ScoredResult | null => {
        const score = query
          ? this.computeScore(query, r.name, [r.cuisine, r.location, r.description])
          : 100;
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
      .sort((a, b) => b.score - a.score);

    return unlimited ? results : results.slice(0, 3);
  }

  private scoreAttractions(query: string, attractions: any[], unlimited = false): ScoredResult[] {
    const results = attractions
      .map((a): ScoredResult | null => {
        const score = query
          ? this.computeScore(query, a.name, [a.category, a.description])
          : 100;
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
      .sort((a, b) => b.score - a.score);

    return unlimited ? results : results.slice(0, 3);
  }

  private scoreGuides(query: string, guides: any[], unlimited = false): ScoredResult[] {
    const results = guides
      .map((g): ScoredResult | null => {
        const score = query
          ? this.computeScore(query, g.name, [g.description])
          : 100;
        return score > 0
          ? {
              id:       g.id,
              name:     g.name,
              subtitle: `${g.pricePerDay} LE / day`,
              image:    g.profilePictureUrl,
              type:     'tourGuide',
              route:    `/tour-guide`,
              score,
            }
          : null;
      })
      .filter((r): r is ScoredResult => r !== null)
      .sort((a, b) => b.score - a.score);

    return unlimited ? results : results.slice(0, 3);
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