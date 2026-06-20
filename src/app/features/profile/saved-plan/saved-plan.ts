// saved-plan.ts
// ============================================================
// بتعرض كل الـ BudgetPlanResponse[] الراجعة من GET /budget-planning
// مفيش localStorage تاني — البلانات بتتجاب وبتتمسح من الباك مباشرة
// ============================================================

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BudgetService } from '../../../core/services/budget.service';
import { BudgetPlanResponse } from '../../../core/model/Budget.model';

@Component({
  selector: 'app-saved-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-plan.html',
  styleUrls: ['./saved-plan.css']
})
export class SavedPlanComponent implements OnInit, OnDestroy {
  plans: BudgetPlanResponse[] = [];
  loading = true;
  errorMsg: string | null = null;

  /** الخطة المطلوب مسحها — بتفتح بوب أب التأكيد */
  planToDelete: BudgetPlanResponse | null = null;

  private navSub?: Subscription;
  private isFirstLoad = true;

  constructor(
  private budgetService: BudgetService,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    // أول تحميل للـ component
    this.fetchPlans();

    // لو الـ component اتعمل مرة واحدة وفضل حي (Angular مابيعيدش إنشاءه
    // لما تعمل navigate لنفس الـ route تاني)، ngOnInit مش هيتكرر.
    // فبنسمع لـ NavigationEnd عشان نعيد الـ fetch في كل مرة الصفحة دي
    // تتزار فعليًا بعد كده، حتى لو الـ instance نفسه فاضل موجود.
    // (بنتجاهل أول NavigationEnd لأنه ده اللي خلق الـ component أصلاً
    // وعملنا له fetch فوق بالفعل).
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects.split('?')[0];
        if (url !== '/profile/saved-plan') return;

        if (this.isFirstLoad) {
          this.isFirstLoad = false;
          return;
        }
        this.fetchPlans();
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private fetchPlans(): void {
    this.loading = true;
    this.errorMsg = null;
    this.budgetService.getMyPlans().subscribe({
     next: (plans) => {
  console.log('Plans loaded:', plans);

  this.plans = [...plans];
  this.loading = false;

  this.cdr.detectChanges();
},
      error: (err) => {
  console.error('Failed to load saved plans', err);
  this.errorMsg = 'حصل خطأ أثناء تحميل خططك المحفوظة.';
  this.loading = false;

  this.cdr.detectChanges();
},
    });
  }

  /**
   * بتحرك أي سلايدر أفقي (مطاعم/أماكن) لشمال أو يمين.
   */
  scrollSection(track: HTMLElement, direction: number): void {
    const amount = track.clientWidth * 0.85 * direction;
    track.scrollBy({ left: amount, behavior: 'smooth' });
  }

  goToDetails(category: string, id: number | null | undefined): void {
    if (!id) return;
    this.router.navigateByUrl(`/${category}/details/${id}`);
  }

  /* ── Delete flow (تأكيد قبل المسح) ────────── */
  requestDeletePlan(plan: BudgetPlanResponse, event: MouseEvent): void {
    event.stopPropagation();
    this.planToDelete = plan;
  }

  cancelDeletePlan(): void {
    this.planToDelete = null;
  }

 confirmDeletePlan(): void {
  if (!this.planToDelete) return;

  const id = this.planToDelete.id;

  this.budgetService.deletePlan(id).subscribe({
    next: () => {

      this.plans = [...this.plans.filter(p => p.id !== id)];

      this.planToDelete = null;

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Failed to delete plan', err);
      this.planToDelete = null;

      this.cdr.detectChanges();
    }
  });
}
}