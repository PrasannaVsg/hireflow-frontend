import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DashboardData, AiUsageStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/analytics`;

  dashboard(days = 30): Observable<DashboardData> {
    const params = new HttpParams().set('days', days);
    return this.http.get<DashboardData>(`${this.base}/dashboard`, { params });
  }

  aiUsage(days = 30): Observable<AiUsageStats> {
    const params = new HttpParams().set('days', days);
    return this.http.get<AiUsageStats>(`${this.base}/ai-usage`, { params });
  }
}
