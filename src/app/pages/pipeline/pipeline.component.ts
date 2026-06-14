import { Component, OnInit, inject } from '@angular/core';
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
export class PipelineComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private jobService = inject(JobService);

  jobs: Job[] = [];
  selectedJobId = '';
  candidates: Candidate[] = [];
  loading = true;
  toastMsg = '';

  stages: PipelineStage[] = ['SOURCED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

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
    this.candidateService.list(this.selectedJobId).subscribe({
      next: p  => { this.candidates = p.content; this.loading = false; },
      error: () => { this.candidates = []; this.loading = false; }
    });
  }

  onJobChange(): void { this.loadCandidates(); }

  candidatesForStage(stage: PipelineStage): Candidate[] {
    return this.candidates.filter(c => c.pipelineStage === stage);
  }

  moveStage(c: Candidate, stage: PipelineStage): void {
    const original = c.pipelineStage;
    this.candidateService.updateStage(c.id, stage).subscribe({
      next: updated => { Object.assign(c, updated); this.toast(`${c.fullName} moved to ${stage}`); },
      error: (err)  => {
        c.pipelineStage = original;
        const msg = err?.error?.message ?? `Failed to move ${c.fullName}`;
        this.toast(msg);
      }
    });
  }

  stageLabel(s: PipelineStage): string {
    return s.charAt(0) + s.slice(1).toLowerCase();
  }

  stageHeaderClass(s: PipelineStage): string {
    if (s === 'HIRED') return 'hired'; if (s === 'REJECTED') return 'rejected'; return '';
  }

  scoreClass(score?: number): string {
    if (!score) return ''; return score >= 75 ? 'high' : score >= 55 ? 'mid' : 'low';
  }

  toast(msg: string): void { this.toastMsg = msg; setTimeout(() => this.toastMsg = '', 2500); }
}
