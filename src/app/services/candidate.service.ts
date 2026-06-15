import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Candidate, CreateCandidateRequest, PageResponse, PipelineStage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/candidates`;

  list(jobId?: string, page = 0, size = 200, from?: string, to?: string): Observable<PageResponse<Candidate>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (jobId) params = params.set('jobId', jobId);
    if (from)  params = params.set('from', from);
    if (to)    params = params.set('to', to);
    return this.http.get<PageResponse<Candidate>>(this.base, { params });
  }

  get(id: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.base}/${id}`);
  }

  create(req: CreateCandidateRequest): Observable<Candidate> {
    return this.http.post<Candidate>(this.base, req);
  }

  batchUpload(files: File[], jobId: string, source: string): Observable<{ jobId: string; fileCount: number; statusUrl: string }> {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('jobId', jobId);
    form.append('source', source);
    return this.http.post<{ jobId: string; fileCount: number; statusUrl: string }>(`${this.base}/batch-upload`, form);
  }

  batchStatus(jobId: string): Observable<{ state: string; total: number; processed: number; succeeded: number; failed: number }> {
    return this.http.get<{ state: string; total: number; processed: number; succeeded: number; failed: number }>(`${this.base}/batch-upload/${jobId}/status`);
  }

  updateStage(id: string, stage: PipelineStage, offerAmount?: number, rejectionReason?: string): Observable<Candidate> {
    return this.http.patch<Candidate>(`${this.base}/${id}/stage`, { targetStage: stage, offerAmount, rejectionReason });
  }

  getResumeUrl(id: string): Observable<string> {
    return this.http.get(`${this.base}/${id}/resume-url`, { responseType: 'text' });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
