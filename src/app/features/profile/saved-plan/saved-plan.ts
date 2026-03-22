import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlanService } from '../../../core/services/plan.service';

@Component({
  selector: 'app-saved-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-plan.html',
  styleUrls: ['./saved-plan.css']
})
export class SavedPlanComponent implements OnInit, OnDestroy {
  myPlan: any = null;
  private planSub?: Subscription;

  constructor(private planService: PlanService, private router: Router) {}

  ngOnInit(): void {
    // 1. لقطة سريعة من الكاش أول ما يفتح عشان الصور تظهر فوراً
    const cached = localStorage.getItem('user_plan');
    if (cached) {
      this.myPlan = JSON.parse(cached);
    }

    // 2. متابعة التحديثات الحية من السيرفيس
    this.planSub = this.planService['savedPlan$'].subscribe((data: any) => {
      if (data) this.myPlan = data;
    });
  }

  /**
   * التنقل للعنوان (URL) حرفياً لضمان عدم حدوث 404
   * بناءً على الـ Routes بتاعتك: 
   * /restaurant/details/:id
   * /tourist-attraction/details/:id
   */
  goToDetails(category: string, id: any) {
    if (!id) {
      console.error("ID مفقود لهذا العنصر!");
      return;
    }
    const fullUrl = `/${category}/details/${id}`;
    console.log("Navigating directly to:", fullUrl);
    this.router.navigateByUrl(fullUrl);
  }

  /**
   * مصلح الصور الذكي: بيضمن إن الموقع دايماً شكله شيك
   * لو الصورة من الداتا بايظة أو مسارها غلط، بيحط صورة احترافية بديلة
   */
  getImage(item: any, type: 'hotel' | 'rest' | 'attr'): string {
    const path = item?.image || item?.imagePath || item?.img || item?.hotelImage || item?.restaurantImage;
    
    // لو المسار موجود وطوله منطقي (أكبر من 5 حروف)
    if (path && path.length > 5) return path;

    // صور Fallback احترافية (عشان متبقاش فيه صورة بايظة)
    const fallbacks = {
      hotel: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      rest: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      attr: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80'
    };
    return fallbacks[type];
  }

  // فنكشن لملء الفراغات لحد 3 كروت في الجريد
  getFillers(currentArray: any[] | undefined | null): any[] {
    const count = currentArray ? currentArray.length : 0;
    const needed = 3 - count;
    return needed > 0 ? new Array(needed) : [];
  }

  ngOnDestroy(): void {
    if (this.planSub) this.planSub.unsubscribe();
  }
}