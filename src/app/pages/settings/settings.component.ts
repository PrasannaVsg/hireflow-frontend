import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, MailSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  mailFrom = '';
  mailReplyTo = '';
  loading = false;
  saving = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loading = true;
    this.settingsService.getMailSettings().subscribe({
      next: s => {
        this.mailFrom = s.mailFrom ?? '';
        this.mailReplyTo = s.mailReplyTo ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast('Failed to load settings.', 'error'); }
    });
  }

  save(): void {
    this.saving = true;
    const payload: MailSettings = {
      mailFrom: this.mailFrom || null,
      mailReplyTo: this.mailReplyTo || null
    };
    this.settingsService.updateMailSettings(payload).subscribe({
      next: s => {
        this.mailFrom = s.mailFrom ?? '';
        this.mailReplyTo = s.mailReplyTo ?? '';
        this.saving = false;
        this.toast('Mail settings saved.', 'success');
      },
      error: () => { this.saving = false; this.toast('Failed to save settings.', 'error'); }
    });
  }

  toast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMsg = msg;
    this.toastType = type;
    setTimeout(() => this.toastMsg = '', 3000);
  }
}
