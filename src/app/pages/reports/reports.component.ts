import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, JobReport } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);

  jobs: JobReport[] = [];
  loading = false;
  searchQuery = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loading = true;
    this.reportService.jobSummary().subscribe({
      next: data => { this.jobs = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): JobReport[] {
    let list = this.jobs;
    if (this.statusFilter) list = list.filter(j => j.status === this.statusFilter);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) list = list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      (j.clientName || '').toLowerCase().includes(q) ||
      (j.jobCode || '').toLowerCase().includes(q)
    );
    return list;
  }

  get totalHired(): number  { return this.filtered.reduce((s, j) => s + j.hiredCount, 0); }
  get totalOffered(): number { return this.filtered.reduce((s, j) => s + j.offeredCount, 0); }

  get totalSaving(): number {
    return this.filtered.reduce((s, j) => s + (j.budgetSaving && j.hiredCount > 0 ? j.budgetSaving : 0), 0);
  }

  budgetLabel(j: JobReport): string {
    if (!j.budgetMin && !j.budgetMax) return '—';
    if (j.budgetMin && j.budgetMax) return `₹${j.budgetMin}–${j.budgetMax} LPA`;
    if (j.budgetMax) return `Up to ₹${j.budgetMax} LPA`;
    return `₹${j.budgetMin}+ LPA`;
  }

  savingClass(j: JobReport): string {
    if (j.budgetSaving == null) return '';
    return j.budgetSaving > 0 ? 'saving-positive' : 'saving-negative';
  }

  savingLabel(j: JobReport): string {
    if (j.budgetSaving == null) return '—';
    const sign = j.budgetSaving >= 0 ? '↓ Saved' : '↑ Over';
    return `${sign} ₹${Math.abs(j.budgetSaving).toLocaleString('en-IN')}`;
  }

  formatLPA(val: number | null): string {
    if (val == null) return '—';
    return `₹${val.toLocaleString('en-IN')} LPA`;
  }
}
