// saved-plan.ts
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

  /** الخطة المطلوب مسحها — بتفتح بوب أب التأكيد، زي منطق البوكينج */
  planToDelete: SavedPlan | null = null;

  constructor(private planService: PlanService, private router: Router) {}

  ngOnInit(): void {
    this.planSub = this.planService.plans$.subscribe((data: SavedPlan[]) => {
      this.plans = data;
    });
  }

  /**
   * بتحرك أي سلايدر أفقي (هوتيل/مطاعم/أماكن) لشمال أو يمين.
   * نفس فكرة scrollSection بتاعة صفحة البوكينج بالظبط.
   */
  scrollSection(track: HTMLElement, direction: number): void {
    const amount = track.clientWidth * 0.85 * direction;
    track.scrollBy({ left: amount, behavior: 'smooth' });
  }

  goToDetails(category: string, id: any): void {
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

  /* ── Delete flow (تأكيد قبل المسح، زي البوكينج) ────────── */
  requestDeletePlan(plan: SavedPlan, event: MouseEvent): void {
    event.stopPropagation();
    this.planToDelete = plan;
  }

  cancelDeletePlan(): void {
    this.planToDelete = null;
  }

  confirmDeletePlan(): void {
    if (!this.planToDelete) return;
    this.planService.deletePlan(this.planToDelete.id);
    this.planToDelete = null;
  }

  ngOnDestroy(): void {
    this.planSub?.unsubscribe();
  }
}