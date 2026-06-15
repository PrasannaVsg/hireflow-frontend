import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface MailSettings {
  mailFrom: string | null;
  mailReplyTo: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/settings`;

  getMailSettings(): Observable<MailSettings> {
    return this.http.get<MailSettings>(`${this.base}/mail`);
  }

  updateMailSettings(settings: MailSettings): Observable<MailSettings> {
    return this.http.put<MailSettings>(`${this.base}/mail`, settings);
  }
}
