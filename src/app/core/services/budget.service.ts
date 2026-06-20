// ============================================================
// budget.service.ts  →  src/app/core/services/
// بيكلم الـ endpoints الحقيقية:
//   POST   /budget-planning/suggest
//   POST   /budget-planning/save
//   GET    /budget-planning            (كل البلانات المحفوظة لليوزر)
//   DELETE /budget-planning/{id}
// ============================================================

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  SuggestBudgetPlanRequest,
  SuggestBudgetPlanResponse,
  SaveBudgetPlanRequest,
  BudgetPlanResponse,
  GetMinimumBudgetRequest,
  GetMinimumBudgetResponse,
} from '../model/Budget.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private readonly baseUrl = `${environment.apiUrl}/budget-planning`;

  // آخر بلان اتعمله suggest/save — تستخدمه details.ts بعد الـ save مباشرة
  private currentPlan = signal<BudgetPlanResponse | null>(null);

  // كل البلانات المحفوظة لليوزر — تستخدمه صفحة saved-plan في البروفايل
  private myPlans = signal<BudgetPlanResponse[]>([]);

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════
  // API CALLS
  // ════════════════════════════════════════════════════════

  /** بيرجع الحد الأدنى للميزانية المطلوبة لعدد أيام معين */
  getMinimumBudget(numberOfDays: number): Observable<GetMinimumBudgetResponse> {
    const body: GetMinimumBudgetRequest = { numberOfDays };
    return this.http.post<GetMinimumBudgetResponse>(`${this.baseUrl}/minimum`, body);
  }

  /** بيرجع اقتراحات الهوتيلات/المطاعم/الأماكن حسب الميزانية وعدد الأيام */
  suggestPlan(totalBudget: number, numberOfDays: number): Observable<SuggestBudgetPlanResponse> {
    const body: SuggestBudgetPlanRequest = { totalBudget, numberOfDays };
    return this.http.post<SuggestBudgetPlanResponse>(`${this.baseUrl}/suggest`, body);
  }

  /**
   * بيحفظ البلان النهائي (هوتيل واحد + مطاعم + أماكن مختارة) في الباك.
   * بعد الحفظ بنحط البلان الراجع في currentPlan (عشان details.ts)
   * وكمان بنضيفه على myPlans (عشان لو رجع المستخدم لصفحة saved-plan
   * من غير ما يعمل reload، يلاقيه موجود على طول من غير ما ننتظر فetch جديد).
   */
  savePlan(request: SaveBudgetPlanRequest): Observable<BudgetPlanResponse> {
    return this.http.post<BudgetPlanResponse>(`${this.baseUrl}/save`, request).pipe(
      tap((plan) => {
        this.currentPlan.set(plan);
        this.myPlans.update((plans) => [plan, ...plans.filter((p) => p.id !== plan.id)]);
      }),
    );
  }

  /**
   * كل البلانات المحفوظة لليوزر الحالي.
   * GET /budget-planning
   */
  getMyPlans(): Observable<BudgetPlanResponse[]> {
    return this.http.get<BudgetPlanResponse[]>(`${this.baseUrl}`).pipe(
      tap((plans) => this.myPlans.set(plans)),
    );
  }

  /** حذف بلان محفوظ */
  deletePlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${planId}`).pipe(
      tap(() => {
        this.myPlans.update((plans) => plans.filter((p) => p.id !== planId));
      }),
    );
  }

  // ════════════════════════════════════════════════════════
  // CURRENT PLAN (آخر بلان اتعمله — بتتستخدم بين main/plan → details)
  // ════════════════════════════════════════════════════════

  setCurrentPlan(plan: BudgetPlanResponse): void {
    this.currentPlan.set(plan);
  }

  getCurrentPlan(): BudgetPlanResponse | null {
    return this.currentPlan();
  }

  clearCurrentPlan(): void {
    this.currentPlan.set(null);
  }
}