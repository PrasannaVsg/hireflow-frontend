import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardData, AiUsageStats } from '../../models/models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  days = 30;
  dashboard: DashboardData | null = null;
  usage: AiUsageStats | null = null;
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = false;
    this.analyticsService.dashboard(this.days).subscribe({
      next: d  => { this.dashboard = d; this.loading = false; },
      error: () => { this.loading = false; this.error = true; }
    });
    this.analyticsService.aiUsage(this.days).subscribe({
      next: u  => this.usage = u,
      error: () => this.usage = null
    });
  }

  funnelRows(): { stage: string; count: number }[] {
    const funnel = this.dashboard?.hiringFunnel ?? {};
    return ['SOURCED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED']
      .map(stage => ({ stage, count: funnel[stage] ?? 0 }));
  }

  funnelMax(): number {
    const vals = Object.values(this.dashboard?.hiringFunnel ?? {});
    return Math.max(...vals, 1);
  }

  funnelPct(count: number): number {
    return Math.round((count / this.funnelMax()) * 100);
  }

  funnelColor(stage: string): string {
    const m: Record<string, string> = {
      SOURCED: '#534AB7', SCREENING: '#6C63C9', INTERVIEW: '#85B05E',
      OFFER: '#639922', HIRED: '#27500A', REJECTED: '#E24B4A'
    };
    return m[stage] ?? '#534AB7';
  }

  get hireRate(): string {
    const funnel = this.dashboard?.hiringFunnel ?? {};
    const hired   = funnel['HIRED']   ?? 0;
    const sourced = funnel['SOURCED'] ?? 0;
    if (!sourced) return '0';
    return ((hired / sourced) * 100).toFixed(0);
  }

  tokenPct(val: number): number {
    if (!this.usage) return 0;
    const total = this.usage.rankingTokens + this.usage.outreachTokens + this.usage.embeddingTokens;
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }

  weeklyMax(): number {
    if (!this.usage?.weeklyBreakdown?.length) return 1;
    return Math.max(...this.usage.weeklyBreakdown.map(
      w => w.rankingTokens + w.outreachTokens + w.embeddingTokens), 1);
  }

  weeklyTotalPct(w: { rankingTokens: number; outreachTokens: number; embeddingTokens: number }): number {
    return Math.round(((w.rankingTokens + w.outreachTokens + w.embeddingTokens) / this.weeklyMax()) * 100);
  }

  stackPct(part: number, w: { rankingTokens: number; outreachTokens: number; embeddingTokens: number }): number {
    const total = w.rankingTokens + w.outreachTokens + w.embeddingTokens;
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
}
