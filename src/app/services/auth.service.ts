import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  mustChangePassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  isLoggedIn = signal(!!localStorage.getItem('hf_token'));

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('hf_token', res.accessToken);
        if (res.refreshToken) localStorage.setItem('hf_refresh', res.refreshToken);
        this.isLoggedIn.set(true);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<void>(`${environment.apiBase}/auth/change-password`, { currentPassword, newPassword });
  }

  logout(): void {
    this.http.post<void>(`${environment.apiBase}/auth/logout`, {}).subscribe({
      complete: () => this._clearSession(),
      error: () => this._clearSession(),
    });
  }

  private _clearSession(): void {
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_refresh');
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('hf_token');
  }

  /** Decode JWT payload without verifying signature (client-side display only). */
  private decodeToken(): Record<string, any> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  get currentUserName(): string {
    const p = this.decodeToken();
    return p?.['fullName'] ?? p?.['email'] ?? '';
  }

  get currentUserInitials(): string {
    const name = this.currentUserName;
    return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  get currentUserRole(): string {
    const role: string = this.decodeToken()?.['role'] ?? '';
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin', ORG_ADMIN: 'Admin',
      RECRUITER: 'Recruiter', HIRING_MANAGER: 'Hiring Manager', READ_ONLY: 'Read Only'
    };
    return map[role] ?? role;
  }
}
