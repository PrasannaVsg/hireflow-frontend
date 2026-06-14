import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Job, CreateJobRequest, PageResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/jobs`;

  list(page = 0, size = 20): Observable<PageResponse<Job>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Job>>(this.base, { params });
  }

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.base}/${id}`);
  }

  create(req: CreateJobRequest): Observable<Job> {
    return this.http.post<Job>(this.base, req);
  }

  update(id: string, req: Partial<CreateJobRequest>): Observable<Job> {
    return this.http.put<Job>(`${this.base}/${id}`, req);
  }

  publish(id: string): Observable<Job> {
    return this.http.patch<Job>(`${this.base}/${id}/status?status=OPEN`, {});
  }

  changeStatus(id: string, status: string): Observable<Job> {
    return this.http.patch<Job>(`${this.base}/${id}/status?status=${status}`, {});
  }

  autoProcess(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/auto-process`, {});
  }

  reindex(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reindex`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
