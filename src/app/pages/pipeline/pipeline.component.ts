import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { JobService } from '../../services/job.service';
import { Candidate, Job, PipelineStage } from '../../models/models';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss']
})
export class PipelineComponent implements OnInit, OnDestroy {
  private candidateService = inject(CandidateService);
  private jobService = inject(JobService);

  jobs: Job[] = [];
  selectedJobId = '';
  candidates: Candidate[] = [];
  loading = true;
  toastMsg = '';
  activeStage: PipelineStage | 'ALL' = 'ALL';
  openMenuId: string | null = null;

  stages: PipelineStage[] = [
    'SOURCED', 'SCREENING',
    'L1_SHORTLIST', 'L1_REJECT',
    'L2_SHORTLIST', 'L2_REJECT',
    'CLIENT_SHORTLIST', 'CLIENT_REJECTED',
    'WAITING_FEEDBACK', 'FINAL_SELECT', 'OFFER_RELEASED', 'HIRED'
  ];

  readonly stageGroups: { label: string; stages: PipelineStage[] }[] = [
    { label: 'Sourcing',  stages: ['SOURCED', 'SCREENING'] },
    { label: 'L1',        stages: ['L1_SHORTLIST', 'L1_REJECT'] },
    { label: 'L2',        stages: ['L2_SHORTLIST', 'L2_REJECT'] },
    { label: 'Client',    stages: ['CLIENT_SHORTLIST', 'CLIENT_REJECTED', 'WAITING_FEEDBACK'] },
    { label: 'Final',     stages: ['FINAL_SELECT', 'OFFER_RELEASED', 'HIRED'] },
  ];

  readonly stageLabels: Record<PipelineStage, string> = {
    SOURCED: 'Sourced', SCREENING: 'Screening',
    L1_SHORTLIST: 'L1 Shortlist', L1_REJECT: 'L1 Reject',
    L2_SHORTLIST: 'L2 Shortlist', L2_REJECT: 'L2 Reject',
    CLIENT_SHORTLIST: 'Client Shortlist', CLIENT_REJECTED: 'Client Rejected',
    WAITING_FEEDBACK: 'Waiting Feedback', FINAL_SELECT: 'Final Select',
    OFFER_RELEASED: 'Offer Released', HIRED: 'Hired'
  };

  ngOnInit(): void {
    this.jobService.list().subscribe({
      next: p  => {
        this.jobs = p.content;
        this.selectedJobId = this.jobs[0]?.id ?? '';
        this.loadCandidates();
      },
      error: () => { this.jobs = []; this.loading = false; }
    });
  }

  loadCandidates(): void {
    if (!this.selectedJobId) { this.candidates = []; this.loading = false; return; }
    this.loading = true;
    this.activeStage = 'ALL';
    this.candidateService.list(this.selectedJobId).subscribe({
      next: p  => { this.candidates = p.content; this.loading = false; },
      error: () => { this.candidates = []; this.loading = false; }
    });
  }

  onJobChange(): void { this.loadCandidates(); }

  get activeCandidates(): Candidate[] {
    if (this.activeStage === 'ALL') return this.candidates;
    return this.candidates.filter(c => c.pipelineStage === this.activeStage);
  }

  countForStage(stage: PipelineStage): number {
    return this.candidates.filter(c => c.pipelineStage === stage).length;
  }

  countForGroup(stages: PipelineStage[]): number {
    return stages.reduce((sum, s) => sum + this.countForStage(s), 0);
  }

  setStage(s: PipelineStage | 'ALL'): void { this.activeStage = s; this.openMenuId = null; }

  isRejectStageStr(s: string): boolean {
    return s === 'L1_REJECT' || s === 'L2_REJECT' || s === 'CLIENT_REJECTED';
  }

  moveStage(c: Candidate, stage: PipelineStage): void {
    if (stage === c.pipelineStage) return;
    const original = c.pipelineStage;
    this.candidateService.updateStage(c.id, stage).subscribe({
      next: updated => { Object.assign(c, updated); this.toast(`Moved to ${this.stageLabels[stage]}`); },
      error: (err)  => {
        c.pipelineStage = original;
        this.toast(err?.error?.message ?? `Cannot move to ${this.stageLabels[stage]}`);
      }
    });
  }

  stageLabel(s: PipelineStage): string { return this.stageLabels[s] ?? s; }

  isRejectStage(s: PipelineStage): boolean {
    return s === 'L1_REJECT' || s === 'L2_REJECT' || s === 'CLIENT_REJECTED';
  }

  scoreClass(score?: number): string {
    if (!score) return ''; return score >= 75 ? 'high' : score >= 55 ? 'mid' : 'low';
  }

  moveTargets(current: PipelineStage): PipelineStage[] {
    return this.stages.filter(s => s !== current);
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  @HostListener('document:click')
  closeMenu(): void { this.openMenuId = null; }

  ngOnDestroy(): void { this.openMenuId = null; }

  toast(msg: string): void { this.toastMsg = msg; setTimeout(() => this.toastMsg = '', 2500); }
}
