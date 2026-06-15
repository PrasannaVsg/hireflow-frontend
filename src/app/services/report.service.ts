import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface JobReport {
  jobId: string;
  jobCode: string | null;
  title: string;
  clientName: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  totalCandidates: number;
  hiredCount: number;
  offeredCount: number;
  avgOfferAmount: number | null;
  totalOfferAmount: number | null;
  budgetSaving: number | null;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/reports`;

  jobSummary(): Observable<JobReport[]> {
    return this.http.get<JobReport[]>(`${this.base}/jobs`);
  }
}
