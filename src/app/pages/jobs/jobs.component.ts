import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { Job, JobStatus, CreateJobRequest } from '../../models/models';

type FilterTab = 'ALL' | 'OPEN' | 'DRAFT' | 'CLOSED';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss']
})
export class JobsComponent implements OnInit {
  private jobService = inject(JobService);

  jobs: Job[] = [];
  loading = true;
  search = '';
  activeTab: FilterTab = 'ALL';
  showModal = false;
  editingJob: Job | null = null;
  saving = false;

  closeTarget: Job | null = null;
  closing = false;
  viewingJob: Job | null = null;

  form: CreateJobRequest = this.blankForm();

  private blankForm(): CreateJobRequest {
    return {
      title: '',
      jobCode: '',
      description: '',
      clientName: '',
      locations: [],
      seniority: 'MID',
      expMin: null,
      expMax: null,
      requiredSkills: '',
      budgetMin: null,
      budgetMax: null,
      mailTemplate: '',
      autoProcessEnabled: false,
      autoEmailOnStageChange: false,
      shortlistSize: 10,
      scoreThreshold: 60,
      emailTone: 'PROFESSIONAL'
    };
  }

  readonly tabs: FilterTab[] = ['ALL', 'OPEN', 'DRAFT', 'CLOSED'];

  readonly seniorityOptions = ['JUNIOR', 'MID', 'SENIOR', 'STAFF', 'PRINCIPAL', 'LEAD'];
  readonly toneOptions = ['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL'];

  get filteredJobs(): Job[] {
    let list = this.jobs;

    if (this.activeTab !== 'ALL') {
      list = list.filter(j => j.status === this.activeTab);
    }

    const q = this.search.toLowerCase().trim();
    if (q) {
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) ||
        (j.locations ?? []).join(' ').toLowerCase().includes(q)
      );
    }

    return list;
  }

  get openCount(): number  { return this.jobs.filter(j => j.status === 'OPEN').length; }
  get draftCount(): number { return this.jobs.filter(j => j.status === 'DRAFT').length; }
  get closedCount(): number { return this.jobs.filter(j => j.status === 'CLOSED').length; }

  tabCount(tab: FilterTab): number {
    if (tab === 'ALL') return this.jobs.length;
    return this.jobs.filter(j => j.status === tab).length;
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.jobService.list(0, 100).subscribe({
      next: p  => { this.jobs = p.content; this.loading = false; },
      error: () => { this.jobs = []; this.loading = false; }
    });
  }

  openModal(): void {
    this.form = this.blankForm();
    this.editingJob = null;
    this.showModal = true;
  }

  openEditModal(job: Job): void {
    this.editingJob = job;
    this.form = {
      title: job.title,
      jobCode: job.jobCode ?? '',
      description: job.description,
      clientName: job.clientName ?? '',
      locations: job.locations ?? [],
      seniority: job.seniority ?? 'MID',
      expMin: job.expMin ?? null,
      expMax: job.expMax ?? null,
      requiredSkills: job.requiredSkills ?? '',
      budgetMin: job.budgetMin ?? null,
      budgetMax: job.budgetMax ?? null,
      mailTemplate: job.mailTemplate ?? '',
      autoProcessEnabled: job.autoProcessEnabled,
      autoEmailOnStageChange: job.autoEmailOnStageChange ?? false,
      shortlistSize: job.autoShortlistSize ?? 10,
      scoreThreshold: job.autoScoreThreshold ?? 60,
      emailTone: job.autoEmailTone ?? 'PROFESSIONAL'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingJob = null;
  }

  saveAsDraft(): void {
    if (!this.form.title.trim() || !this.form.description.trim()) return;
    this.saving = true;
    if (this.editingJob) {
      this.saveEdit();
      return;
    }
    this.jobService.create(this.form).subscribe({
      next: job => { this.jobs = [job, ...this.jobs]; this.saving = false; this.showModal = false; },
      error: () => { this.saving = false; }
    });
  }

  private saveEdit(): void {
    if (!this.editingJob) return;
    this.jobService.update(this.editingJob.id, this.form).subscribe({
      next: updated => {
        const i = this.jobs.findIndex(j => j.id === this.editingJob!.id);
        if (i >= 0) this.jobs = [...this.jobs.slice(0, i), updated, ...this.jobs.slice(i + 1)];
        this.saving = false;
        this.showModal = false;
        this.editingJob = null;
      },
      error: () => { this.saving = false; }
    });
  }

  publishNew(): void {
    if (!this.form.title.trim() || !this.form.description.trim()) return;
    this.saving = true;
    this.jobService.create(this.form).subscribe({
      next: created => {
        this.jobService.publish(created.id).subscribe({
          next: published => { this.jobs = [published, ...this.jobs]; this.saving = false; this.showModal = false; },
          error: () => { this.jobs = [created, ...this.jobs]; this.saving = false; this.showModal = false; }
        });
      },
      error: () => { this.saving = false; }
    });
  }

  publish(job: Job): void {
    this.jobService.publish(job.id).subscribe({
      next: updated => {
        const i = this.jobs.findIndex(j => j.id === job.id);
        if (i >= 0) this.jobs = [...this.jobs.slice(0, i), updated, ...this.jobs.slice(i + 1)];
      }
    });
  }

  reindex(job: Job): void {
    this.jobService.reindex(job.id).subscribe();
  }

  viewJob(job: Job): void { this.viewingJob = job; }
  closeViewModal(): void { this.viewingJob = null; }

  confirmClose(job: Job): void { this.closeTarget = job; }
  cancelClose(): void { this.closeTarget = null; }

  doClose(): void {
    if (!this.closeTarget) return;
    this.closing = true;
    this.jobService.changeStatus(this.closeTarget.id, 'CLOSED').subscribe({
      next: updated => {
        const i = this.jobs.findIndex(j => j.id === this.closeTarget!.id);
        if (i >= 0) this.jobs = [...this.jobs.slice(0, i), updated, ...this.jobs.slice(i + 1)];
        this.closeTarget = null;
        this.closing = false;
      },
      error: () => { this.closing = false; }
    });
  }

  candidateCount(job: Job): number {
    return job.candidateCount ?? 0;
  }

  createdAt(job: Job): string | null {
    return job.createdAt ?? null;
  }

  hasEmbedding(job: Job): boolean {
    return (job as any).hasEmbedding ?? false;
  }

  parseLocations(value: string): void {
    this.form.locations = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
}
