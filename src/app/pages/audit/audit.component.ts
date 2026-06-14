import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/audit.service';
import { AuditLog } from '../../models/models';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  JOB_CREATED:             { label: 'Job Created',          color: '#4ab34a' },
  JOB_UPDATED:             { label: 'Job Updated',          color: '#388cdc' },
  JOB_PUBLISHED:           { label: 'Job Published',        color: '#6C63C9' },
  JOB_CLOSED:              { label: 'Job Closed',           color: '#d4972a' },
  JOB_DELETED:             { label: 'Job Deleted',          color: '#dc3c3c' },
  CANDIDATE_CREATED:       { label: 'Candidate Added',      color: '#4ab34a' },
  CANDIDATE_DELETED:       { label: 'Candidate Deleted',    color: '#dc3c3c' },
  CANDIDATES_UPLOADED:     { label: 'Batch Upload',         color: '#388cdc' },
  CANDIDATE_STAGE_CHANGED: { label: 'Stage Changed',        color: '#6C63C9' },
};

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {
  private auditService = inject(AuditService);

  logs: AuditLog[] = [];
  loading = false;
  totalElements = 0;
  page = 0;
  pageSize = 50;

  filterAction = '';
  filterEntity = '';

  readonly actionOptions = Object.keys(ACTION_LABELS);
  readonly entityOptions = ['JOB', 'CANDIDATE'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.auditService.list(
      this.page, this.pageSize,
      this.filterAction || undefined,
      this.filterEntity || undefined
    ).subscribe({
      next: p  => { this.logs = p.content; this.totalElements = p.totalElements; this.loading = false; },
      error: () => { this.logs = []; this.loading = false; }
    });
  }

  applyFilters(): void { this.page = 0; this.load(); }
  clearFilters(): void { this.filterAction = ''; this.filterEntity = ''; this.page = 0; this.load(); }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void { if ((this.page + 1) * this.pageSize < this.totalElements) { this.page++; this.load(); } }

  get totalPages(): number { return Math.ceil(this.totalElements / this.pageSize); }
  get hasFilters(): boolean { return !!this.filterAction || !!this.filterEntity; }

  actionMeta(action: string): { label: string; color: string } {
    return ACTION_LABELS[action] ?? { label: action, color: '#9e9c97' };
  }
}
