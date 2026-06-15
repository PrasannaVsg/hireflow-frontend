import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { OutreachEmail, PageResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OutreachService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/outreach`;

  list(page = 0, size = 50): Observable<PageResponse<OutreachEmail>> {
    return this.http.get<PageResponse<OutreachEmail>>(`${this.base}?page=${page}&size=${size}`);
  }

  draft(candidateId: string, jobId: string, tone?: string): Observable<OutreachEmail> {
    return this.http.post<OutreachEmail>(`${this.base}/draft`, { candidateId, jobId, tone });
  }

  send(id: string): Observable<OutreachEmail> {
    return this.http.post<OutreachEmail>(`${this.base}/${id}/send`, {});
  }

  approve(id: string): Observable<OutreachEmail> {
    return this.http.patch<OutreachEmail>(`${this.base}/${id}/status`, { status: 'APPROVED' });
  }

  reject(id: string): Observable<OutreachEmail> {
    return this.http.patch<OutreachEmail>(`${this.base}/${id}/status`, { status: 'REJECTED' });
  }
}
