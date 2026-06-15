import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OutreachService } from '../../services/outreach.service';
import { OutreachEmail } from '../../models/models';

@Component({
  selector: 'app-outreach',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './outreach.component.html',
  styleUrls: ['./outreach.component.scss']
})
export class OutreachComponent implements OnInit {
  private outreachService = inject(OutreachService);

  emails: OutreachEmail[] = [];
  loading = false;
  toastMsg = '';

  ngOnInit(): void {
    this.loadEmails();
  }

  loadEmails(): void {
    this.loading = true;
    this.outreachService.list().subscribe({
      next: page => { this.emails = page.content; this.loading = false; },
      error: () => { this.loading = false; this.toast('Failed to load outreach emails.'); }
    });
  }

  approve(email: OutreachEmail): void {
    const original = { ...email };
    email.status = 'APPROVED';
    this.outreachService.approve(email.id).subscribe({
      next: updated => Object.assign(email, updated),
      error: () => {
        Object.assign(email, original);
        this.toast('Failed to approve email — please try again.');
      }
    });
    this.toast(`Email approved & sent to ${email.candidateName ?? email.candidateId}`);
  }

  reject(email: OutreachEmail): void {
    const original = { ...email };
    email.status = 'REJECTED';
    this.outreachService.reject(email.id).subscribe({
      next: updated => Object.assign(email, updated),
      error: () => {
        Object.assign(email, original);
        this.toast('Failed to reject email — please try again.');
      }
    });
  }

  displayName(email: OutreachEmail): string {
    return email.candidateName ?? email.candidateId;
  }

  get draftCount(): number    { return this.emails.filter(e => e.status === 'DRAFT').length; }
  get approvedCount(): number { return this.emails.filter(e => e.status === 'APPROVED').length; }
  get sentCount(): number     { return this.emails.filter(e => e.status === 'SENT').length; }

  relativeTime(iso: string | undefined): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  toast(msg: string): void { this.toastMsg = msg; setTimeout(() => this.toastMsg = '', 2500); }
}
