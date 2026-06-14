import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuditLog, PageResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/audit`;

  list(page = 0, size = 50, action?: string, entityType?: string, userId?: string): Observable<PageResponse<AuditLog>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (action)     params = params.set('action', action);
    if (entityType) params = params.set('entityType', entityType);
    if (userId)     params = params.set('userId', userId);
    return this.http.get<PageResponse<AuditLog>>(this.base, { params });
  }
}
