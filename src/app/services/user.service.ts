import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '../models/models';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'READ_ONLY';
  enabled: boolean;
}

export const roleLabel: Record<AppUser['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  READ_ONLY: 'Read Only',
};

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: AppUser['role'];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/users`;

  list(page = 0, size = 50): Observable<PageResponse<AppUser>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AppUser>>(this.base, { params });
  }

  create(req: CreateUserRequest): Observable<AppUser> {
    return this.http.post<AppUser>(this.base, req);
  }

  disable(id: string): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.base}/${id}/disable`, {});
  }

  enable(id: string): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.base}/${id}/enable`, {});
  }

  resetPassword(id: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/reset-password`, { newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/me/change-password`, { currentPassword, newPassword });
  }
}
