// ============================================================
// budget.service.ts  →  src/app/core/services/
// بيكلم الـ endpoints الحقيقية:
//   POST /budget-planning/suggest
//   POST /budget-planning/save
//   GET  /budget-planning/my-plans   (لصفحة الـ saved plans)
//   DELETE /budget-planning/{id}
// ============================================================

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /** بيحفظ البلان النهائي (هوتيل واحد + مطاعم + أماكن مختارة) */
  savePlan(request: SaveBudgetPlanRequest): Observable<BudgetPlanResponse> {
    return this.http.post<BudgetPlanResponse>(`${this.baseUrl}/save`, request).pipe();
  }

  /** كل البلانات المحفوظة لليوزر الحالي */
  getMyPlans(): Observable<BudgetPlanResponse[]> {
    return this.http.get<BudgetPlanResponse[]>(`${this.baseUrl}/my-plans`);
  }

  /** حذف بلان محفوظ */
  deletePlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${planId}`);
  }

  // ════════════════════════════════════════════════════════
  // CURRENT PLAN (في الذاكرة بس — بتتستخدم بين main/plan → details)
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