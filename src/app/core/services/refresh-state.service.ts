import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshStateService {
  isRefreshing = false;
  tokenSubject = new BehaviorSubject<string | null>(null);
}