import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';
import { JobService } from '../../services/job.service';
import { DashboardData, Job } from '../../models/models';

const STAGE_ORDER = ['SOURCED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STAGE_COLORS: Record<string, string> = {
  SOURCED:   '#6C63C9',
  SCREENING: '#BA7517',
  INTERVIEW: '#388cdc',
  OFFER:     '#534AB7',
  HIRED:     '#4ab34a',
  REJECTED:  '#e24b4a',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private jobService       = inject(JobService);

  data: DashboardData | null = null;
  jobs: Job[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading = false; };

    this.analyticsService.dashboard(30).subscribe({
      next: d  => { this.data = d; done(); },
      error: () => { this.error = true; done(); }
    });

    this.jobService.list(0, 100).subscribe({
      next: p  => { this.jobs = p.content; done(); },
      error: () => done()
    });
  }

  // ── Job stats ─────────────────────────────────────────────────────────────
  get openJobs():   number { return this.jobs.filter(j => j.status === 'OPEN').length; }
  get draftJobs():  number { return this.jobs.filter(j => j.status === 'DRAFT').length; }
  get closedJobs(): number { return this.jobs.filter(j => j.status === 'CLOSED').length; }
  get onHoldJobs(): number { return this.jobs.filter(j => j.status === 'ON_HOLD').length; }

  get topJobs(): Job[] {
    return this.jobs.filter(j => j.status === 'OPEN').slice(0, 5);
  }

  jobStatusSlices(): { label: string; count: number; color: string; pct: number }[] {
    const total = this.jobs.length || 1;
    const items = [
      { label: 'Open',    count: this.openJobs,   color: '#4ab34a' },
      { label: 'Draft',   count: this.draftJobs,  color: '#6C63C9' },
      { label: 'On Hold', count: this.onHoldJobs, color: '#BA7517' },
      { label: 'Closed',  count: this.closedJobs, color: '#e24b4a' },
    ];
    return items.map(i => ({ ...i, pct: Math.round((i.count / total) * 100) }));
  }

  /** SVG donut for jobs-by-status */
  donutSegments(): { d: string; color: string; label: string; count: number }[] {
    const slices = this.jobStatusSlices().filter(s => s.count > 0);
    const total  = slices.reduce((s, x) => s + x.count, 0) || 1;
    const cx = 60, cy = 60, r = 48, stroke = 22;
    const segments: { d: string; color: string; label: string; count: number }[] = [];
    let startAngle = -Math.PI / 2;
    for (const s of slices) {
      const sweep = (s.count / total) * 2 * Math.PI;
      const endAngle = startAngle + sweep;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const large = sweep > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
      segments.push({ d, color: s.color, label: s.label, count: s.count });
      startAngle = endAngle;
    }
    return segments;
  }

  // ── Hiring funnel ─────────────────────────────────────────────────────────
  funnelRows(): { stage: string; count: number; color: string; pct: number }[] {
    const funnel = this.data?.hiringFunnel ?? {};
    const max = Math.max(...Object.values(funnel), 1);
    return STAGE_ORDER.map(stage => ({
      stage,
      count: funnel[stage] ?? 0,
      color: STAGE_COLORS[stage] ?? '#6C63C9',
      pct:   Math.round(((funnel[stage] ?? 0) / max) * 100),
    }));
  }

  totalCandidates(): number {
    const funnel = this.data?.hiringFunnel ?? {};
    return Object.values(funnel).reduce((s, v) => s + v, 0);
  }

  hiredCount(): number {
    return this.data?.hiringFunnel?.['HIRED'] ?? 0;
  }

  stageColor(stage: string): string {
    return STAGE_COLORS[stage] ?? '#6C63C9';
  }

  // ── Recent activity ───────────────────────────────────────────────────────
  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  activityIcon(op: string): string {
    const map: Record<string, string> = {
      RANKING:   'ti-sparkles',
      OUTREACH:  'ti-mail',
      EMBEDDING: 'ti-cpu',
    };
    return map[op] ?? 'ti-activity';
  }

  activityLabel(a: { operation: string; model: string; success: boolean; latencyMs: number }): string {
    const status = a.success ? 'succeeded' : 'failed';
    return `${a.operation} ${status} · ${a.model} · ${a.latencyMs}ms`;
  }
}
