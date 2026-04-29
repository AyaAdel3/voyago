import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlanService, SavedPlan } from '../../../core/services/plan.service';

@Component({
  selector: 'app-saved-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-plan.html',
  styleUrls: ['./saved-plan.css']
})
export class SavedPlanComponent implements OnInit, OnDestroy {
  plans: SavedPlan[] = [];
  private planSub?: Subscription;

  // ── 1. ستايدر الخطط الأساسي (Your Plans) ──
  planOffset = 0; 
  readonly PLANS_VISIBLE = 3; 

  // ── 2. إندكس السلايدر الداخلي (المطاعم والأماكن) ──
  sliderIndex: {
    [planId: string]: {
      restaurants: number;
      tourGuides: number;
      attractions: number;
    };
  } = {};

  constructor(private planService: PlanService, private router: Router) {}

  ngOnInit(): void {
    this.planSub = this.planService.plans$.subscribe((data: SavedPlan[]) => {
      this.plans = data;
      
      // لو مسحت خطة والـ offset كان كبير، نرجعه لورا عشان ميبقاش "Not Found"
      if (this.planOffset >= this.plans.length && this.plans.length > 0) {
        this.planOffset = Math.max(0, this.plans.length - this.PLANS_VISIBLE);
      }

      this.plans.forEach(plan => {
        if (!this.sliderIndex[plan.id]) {
          this.sliderIndex[plan.id] = {
            restaurants: 0,
            tourGuides: 0,
            attractions: 0
          };
        }
      });
    });
  }

  // ── 3. دوال السلايدر الأساسي (الخطط) ──
  nextPlans() {
    if (this.planOffset + this.PLANS_VISIBLE < this.plans.length) {
      this.planOffset++;
    }
  }

  prevPlans() {
    if (this.planOffset > 0) {
      this.planOffset--;
    }
  }

  get visiblePlans(): SavedPlan[] {
    return this.plans.slice(this.planOffset, this.planOffset + this.PLANS_VISIBLE);
  }

  // ── 4. دوال السلايدر الداخلي (المطاعم والأماكن جوه الخطة) ──
  readonly VISIBLE = 1; // عدد العناصر اللي بتظهر في السلايدر الداخلي

  slideNext(planId: string, section: 'restaurants' | 'tourGuides' | 'attractions', total: number) {
    const max = Math.max(0, total - this.VISIBLE);
    this.sliderIndex[planId][section] = Math.min(this.sliderIndex[planId][section] + 1, max);
  }

  slidePrev(planId: string, section: 'restaurants' | 'tourGuides' | 'attractions') {
    this.sliderIndex[planId][section] = Math.max(0, this.sliderIndex[planId][section] - 1);
  }

  canSlideNext(planId: string, section: 'restaurants' | 'tourGuides' | 'attractions', total: number): boolean {
    return (this.sliderIndex[planId]?.[section] ?? 0) < total - this.VISIBLE;
  }

  canSlidePrev(planId: string, section: 'restaurants' | 'tourGuides' | 'attractions'): boolean {
    return (this.sliderIndex[planId]?.[section] ?? 0) > 0;
  }

  getVisible(items: any[], planId: string, section: 'restaurants' | 'tourGuides' | 'attractions'): any[] {
    if (!items) return [];
    const start = this.sliderIndex[planId]?.[section] ?? 0;
    return items.slice(start, start + this.VISIBLE);
  }

  // ── 5. دوال مساعدة ──
  goToDetails(category: string, id: any) {
    if (!id) return;
    this.router.navigateByUrl(`/${category}/details/${id}`);
  }

  getImage(item: any, type: 'hotel' | 'rest' | 'attr' | 'guide'): string {
    const path = item?.image || item?.imagePath || item?.img || item?.images?.[0];
    if (path && path.length > 5) return path;
    const fallbacks: any = {
      hotel: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      rest:  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      attr:  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80',
      guide: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    };
    return fallbacks[type];
  }

  deletePlan(planId: string) {
    this.planService.deletePlan(planId);
  }

  ngOnDestroy(): void {
    this.planSub?.unsubscribe();
  }
}