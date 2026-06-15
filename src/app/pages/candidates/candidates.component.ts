import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { JobService } from '../../services/job.service';
import { RankingService } from '../../services/ranking.service';
import { OutreachService } from '../../services/outreach.service';
import { Candidate, Job, Ranking, PipelineStage, CandidateSource } from '../../models/models';

type RankingView = Ranking & { showBreakdown?: boolean };

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss']
})
export class CandidatesComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private jobService        = inject(JobService);
  private rankingService    = inject(RankingService);
  private outreachService   = inject(OutreachService);
  private route             = inject(ActivatedRoute);
  private sanitizer         = inject(DomSanitizer);

  // ── State ──────────────────────────────────────────────────────────────
  selectedJobId = '';
  jobs: Job[] = [];
  allCandidates: Candidate[] = [];
  rankings: RankingView[] = [];
  loading = false;

  // Search
  searchQuery = '';

  // Date filter
  dateFrom = '';
  dateTo = '';

  // Delete confirm
  deleteTarget: Candidate | null = null;
  deleting = false;

  // Batch upload modal
  showUploadModal = false;
  uploadJobId = '';
  uploadSource: CandidateSource = 'DIRECT';
  uploadedFiles: { name: string; status: 'queued' | 'uploading' | 'done' | 'error'; size: string; file?: File }[] = [];
  uploading = false;
  isDragOver = false;

  readonly sources: CandidateSource[] = ['NAUKRI','LINKEDIN','INDEED','INTERNSHALA','REFERRAL','DIRECT','OTHER'];

  // Ranking
  rankingState: 'idle' | 'running' | 'done' | 'failed' = 'idle';
  rankingError = '';
  rankProgress = 0;
  rankProgressText = '';
  rankingCandidateId: string | null = null;

  // Sort
  sortByScore = false;

  // UI
  toastMsg = '';
  stageFilter: PipelineStage | '' = '';
  openDropdownId: string | null = null;
  dropdownPos = { top: 0, left: 0 };
  expandedCandidateId: string | null = null;

  private closeOnScroll = () => { this.openDropdownId = null; };
  private closeOnResize = () => { this.openDropdownId = null; };

  // Resume dialog
  resumeDialog: { name: string; url: string; isPdf: boolean; safeUrl?: SafeResourceUrl; docxHtml?: SafeHtml; docxLoading?: boolean } | null = null;

  stages: PipelineStage[] = [
    'SOURCED','SCREENING',
    'L1_SHORTLIST','L1_REJECT',
    'L2_SHORTLIST','L2_REJECT',
    'CLIENT_SHORTLIST','CLIENT_REJECTED',
    'WAITING_FEEDBACK','FINAL_SELECT','OFFER_RELEASED','HIRED'
  ];

  readonly stageLabels: Record<PipelineStage, string> = {
    SOURCED:          'Sourced',
    SCREENING:        'Screening',
    L1_SHORTLIST:     'L1 Shortlist',
    L1_REJECT:        'L1 Reject',
    L2_SHORTLIST:     'L2 Shortlist',
    L2_REJECT:        'L2 Reject',
    CLIENT_SHORTLIST: 'Client Shortlist',
    CLIENT_REJECTED:  'Client Rejected',
    WAITING_FEEDBACK: 'Waiting Feedback',
    FINAL_SELECT:     'Final Select',
    OFFER_RELEASED:   'Offer Released',
    HIRED:            'Hired'
  };

  // Offer / rejection modal
  showOfferModal = false;
  pendingStageCandidate: Candidate | null = null;
  pendingStage: PipelineStage | null = null;
  offerAmountInput: number | null = null;
  rejectionReasonInput = '';

  // ── Getters ────────────────────────────────────────────────────────────
  get activeJobs() {
    return this.jobs.filter(j => j.status !== 'CLOSED' && j.status !== 'ARCHIVED');
  }

  get selectedJobTitle(): string {
    if (!this.selectedJobId) return 'All Jobs';
    return this.jobs.find(j => j.id === this.selectedJobId)?.title ?? '';
  }

  get filteredCandidates(): Candidate[] {
    let list = this.stageFilter
      ? this.allCandidates.filter(c => c.pipelineStage === this.stageFilter)
      : this.allCandidates;

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.jobTitle || '').toLowerCase().includes(q)
      );
    }

    if (this.sortByScore) {
      list = [...list].sort((a, b) => {
        const ra = this.rankingFor(a.id);
        const rb = this.rankingFor(b.id);
        const sa = ra?.llmScore ?? -1;
        const sb = rb?.llmScore ?? -1;
        return sb - sa;
      });
    }

    return list;
  }

  get queuedCount(): number  { return this.uploadedFiles.filter(f => f.status === 'queued').length; }
  get hasQueued(): boolean   { return this.queuedCount > 0; }
  get doneCount(): number    { return this.uploadedFiles.filter(f => f.status === 'done').length; }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    window.addEventListener('scroll', this.closeOnScroll, true);
    window.addEventListener('resize', this.closeOnResize);
    const paramJobId = this.route.snapshot.paramMap.get('jobId') ?? '';
    this.loading = true;
    this.jobService.list(0, 100).subscribe({
      next: p  => {
        this.jobs = p.content;
        this.selectedJobId = paramJobId;
        this.uploadJobId = paramJobId || (p.content[0]?.id ?? '');
        this.loadCandidates();
      },
      error: () => {
        this.jobs = [];
        this.selectedJobId = paramJobId;
        this.loadCandidates();
      }
    });
  }

  onJobChange(): void {
    this.stageFilter = '';
    this.rankings = [];
    this.rankingState = 'idle';
    this.loadCandidates();
  }

  loadCandidates(): void {
    this.loading = true;
    const jobId = this.selectedJobId || undefined;
    const from  = this.dateFrom || undefined;
    const to    = this.dateTo   || undefined;
    this.candidateService.list(jobId, 0, 200, from, to).subscribe({
      next: p  => {
        this.allCandidates = p.content;
        this.loading = false;
        if (jobId) {
          this.loadRankings([jobId]);
        } else {
          const uniqueJobIds = [...new Set(p.content.map(c => c.jobId).filter(Boolean))];
          if (uniqueJobIds.length > 0) this.loadRankings(uniqueJobIds);
        }
      },
      error: () => { this.allCandidates = []; this.loading = false; }
    });
  }

  loadRankings(jobIds: string[]): void {
    this.rankings = [];
    jobIds.forEach(jobId => {
      this.rankingService.list(jobId, 0, 200).subscribe({
        next: p => {
          if (p.content.length > 0) {
            this.rankings = [...this.rankings, ...p.content];
            this.rankingState = 'done';
          }
        },
        error: () => {}
      });
    });
  }

  applyDateFilter(): void { this.loadCandidates(); }
  clearDateFilter(): void { this.dateFrom = ''; this.dateTo = ''; this.loadCandidates(); }

  // ── Upload modal ───────────────────────────────────────────────────────
  openUploadModal(): void {
    this.uploadedFiles = [];
    this.uploadJobId = this.selectedJobId || (this.jobs[0]?.id ?? '');
    this.uploadSource = 'DIRECT';
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    if (this.uploading) return;
    this.showUploadModal = false;
    this.uploadedFiles = [];
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) this.stageFiles(Array.from(files));
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.stageFiles(Array.from(input.files));
    input.value = '';
  }

  private stageFiles(files: File[]): void {
    const allowed = files.filter(f => f.name.match(/\.(pdf|docx)$/i));
    if (allowed.length < files.length) {
      this.toast(`${files.length - allowed.length} file(s) skipped — only PDF/DOCX allowed`);
    }
    allowed.forEach(file => {
      if (!this.uploadedFiles.some(e => e.name === file.name)) {
        this.uploadedFiles.push({ name: file.name, status: 'queued', size: this.formatSize(file.size), file });
      }
    });
  }

  removeFile(i: number): void { this.uploadedFiles.splice(i, 1); }

  startUpload(): void {
    const queued = this.uploadedFiles.filter(e => e.status === 'queued' && e.file);
    if (!queued.length || !this.uploadJobId) return;
    this.uploading = true;
    queued.forEach(e => e.status = 'uploading');
    this.candidateService.batchUpload(queued.map(e => e.file!), this.uploadJobId, this.uploadSource).subscribe({
      next: res => {
        this.uploading = false;
        this.toast(`${res.fileCount} resume${res.fileCount !== 1 ? 's' : ''} accepted for processing`);
        this.closeUploadModal();
        this.pollBatchCompletion(this.uploadJobId, res.jobId, 0);
      },
      error: () => {
        queued.forEach(e => e.status = 'error');
        this.uploading = false;
        this.toast('Upload failed. Please try again.');
      }
    });
  }

  private pollBatchCompletion(jobId: string, batchJobId: string, attempts: number): void {
    if (attempts > 60) {
      this.loadCandidates();
      this.toast('Processing taking longer than expected — please rank manually if needed');
      return;
    }
    this.candidateService.batchStatus(batchJobId).subscribe({
      next: status => {
        if (status.state === 'COMPLETED' || status.state === 'FAILED') {
          this.loadCandidates();
          const job = this.jobs.find(j => j.id === jobId);
          if (job?.autoProcessEnabled) {
            this.jobService.autoProcess(jobId).subscribe({
              next: () => {
                this.toast('Auto-ranking complete — loading results…');
                setTimeout(() => this.loadRankings([jobId]), 2000);
              },
              error: () => this.toast('Resumes processed but auto-ranking failed')
            });
          }
        } else {
          const pct = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
          this.toast(`Processing resumes… ${pct}% (${status.processed}/${status.total})`);
          setTimeout(() => this.pollBatchCompletion(jobId, batchJobId, attempts + 1), 3000);
        }
      },
      error: () => setTimeout(() => this.pollBatchCompletion(jobId, batchJobId, attempts + 1), 3000)
    });
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // ── Resume dialog ──────────────────────────────────────────────────────
  viewResume(c: Candidate): void {
    this.candidateService.getResumeUrl(c.id).subscribe({
      next: url => {
        const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.resumeDialog = { name: c.fullName, url, isPdf, safeUrl, docxLoading: !isPdf };
        if (!isPdf) this.loadDocx(url);
      },
      error: () => this.toast(`Resume not available for ${c.fullName}`)
    });
  }

  private async loadDocx(url: string): Promise<void> {
    try {
      const mammoth = await import('mammoth');
      const resp = await fetch(url);
      const buf  = await resp.arrayBuffer();
      const res  = await mammoth.convertToHtml({ arrayBuffer: buf });
      if (this.resumeDialog) {
        this.resumeDialog.docxHtml    = this.sanitizer.bypassSecurityTrustHtml(res.value);
        this.resumeDialog.docxLoading = false;
      }
    } catch {
      if (this.resumeDialog) this.resumeDialog.docxLoading = false;
    }
  }

  closeResumeDialog(): void { this.resumeDialog = null; }

  // ── Ranking ────────────────────────────────────────────────────────────
  rankOneCandidate(c: Candidate): void {
    const jobId = c.jobId || this.selectedJobId;
    if (!jobId) return;
    this.rankingCandidateId = c.id;
    this.rankingService.rankSingle(jobId, c.id).subscribe({
      next: r => {
        this.rankings = [...this.rankings.filter(x => x.candidateId !== r.candidateId), r];
        this.rankingCandidateId = null;
        this.toast(`${c.fullName} scored: ${r.llmScore ?? 'N/A'}`);
      },
      error: (err) => {
        this.rankingCandidateId = null;
        this.toast(err?.error?.message ?? `Ranking failed for ${c.fullName}`);
      }
    });
  }

  runRanking(jobId?: string): void {
    const targetJobId = jobId || this.selectedJobId;
    if (!targetJobId) return;
    this.rankingState = 'running';
    this.rankProgress = 0;
    this.rankingError = '';
    const steps = this.allCandidates.map(c => c.fullName);
    let i = 0;
    const tick = setInterval(() => {
      this.rankProgressText = `Analysing ${steps[i] ?? '...'}`;
      this.rankProgress = Math.round(((i + 1) / steps.length) * 90);
      i++;
      if (i >= steps.length) {
        clearInterval(tick);
        const sizeToRank = Math.max(this.allCandidates.length, 50);
        this.rankingService.run(targetJobId, sizeToRank).subscribe({
          next: r  => {
            this.rankings = [...this.rankings.filter(x => !r.find(n => n.candidateId === x.candidateId)), ...r];
            this.rankProgress = 100;
            this.rankingState = 'done';
            this.toast('AI ranking complete');
          },
          error: (err) => {
            this.rankProgress = 0;
            this.rankingState = 'failed';
            this.rankingError = err?.error?.message ?? 'Ranking failed. Please try again.';
          }
        });
      }
    }, 600);
  }

  // ── Outreach ───────────────────────────────────────────────────────────
  draftEmailForCandidate(c: Candidate): void {
    this.outreachService.draft(c.id, c.jobId ?? this.selectedJobId).subscribe({
      next: () => this.toast(`Outreach drafted for ${c.fullName} — check Outreach tab`),
      error: () => this.toast(`Failed to draft outreach for ${c.fullName}`)
    });
  }

  stageLabel(s: PipelineStage): string { return this.stageLabels[s] ?? s; }

  // ── Stage ──────────────────────────────────────────────────────────────
  private readonly REJECTION_STAGES: PipelineStage[] = ['L1_REJECT','L2_REJECT','CLIENT_REJECTED'];

  updateStage(c: Candidate, stage: PipelineStage): void {
    this.openDropdownId = null;
    if (stage === 'FINAL_SELECT') {
      this.pendingStageCandidate = c;
      this.pendingStage = stage;
      this.offerAmountInput = null;
      this.rejectionReasonInput = '';
      this.showOfferModal = true;
      return;
    }
    if (this.REJECTION_STAGES.includes(stage)) {
      this.pendingStageCandidate = c;
      this.pendingStage = stage;
      this.rejectionReasonInput = '';
      this.offerAmountInput = null;
      this.showOfferModal = true;
      return;
    }
    this.commitStage(c, stage, null, null);
  }

  confirmOfferModal(): void {
    if (!this.pendingStageCandidate || !this.pendingStage) return;
    this.commitStage(this.pendingStageCandidate, this.pendingStage,
      this.offerAmountInput, this.rejectionReasonInput || null);
    this.showOfferModal = false;
    this.pendingStageCandidate = null;
    this.pendingStage = null;
  }

  cancelOfferModal(): void {
    this.showOfferModal = false;
    this.pendingStageCandidate = null;
    this.pendingStage = null;
  }

  private commitStage(c: Candidate, stage: PipelineStage,
                      offerAmount: number | null, rejectionReason: string | null): void {
    const original = c.pipelineStage;
    c.pipelineStage = stage;
    this.candidateService.updateStage(c.id, stage, offerAmount ?? undefined, rejectionReason ?? undefined).subscribe({
      next: updated => {
        Object.assign(c, updated);
        this.toast(`${c.fullName} moved to ${this.stageLabel(stage)}`);
      },
      error: (err) => {
        c.pipelineStage = original;
        this.toast(err?.error?.message ?? `Failed to move ${c.fullName}`);
      }
    });
  }

  toggleDropdown(id: string, event: Event): void {
    event.stopPropagation();
    if (this.openDropdownId === id) {
      this.openDropdownId = null;
      return;
    }
    const btn = (event.currentTarget as HTMLElement);
    const rect = btn.getBoundingClientRect();
    this.dropdownPos = { top: rect.bottom + 4, left: rect.left };
    this.openDropdownId = id;
  }

  closeDropdowns(): void { this.openDropdownId = null; }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.closeOnScroll, true);
    window.removeEventListener('resize', this.closeOnResize);
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  confirmDelete(c: Candidate): void { this.deleteTarget = c; }
  cancelDelete(): void { this.deleteTarget = null; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.candidateService.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this.allCandidates = this.allCandidates.filter(c => c.id !== this.deleteTarget!.id);
        this.toast(`${this.deleteTarget!.fullName} removed`);
        this.deleteTarget = null;
        this.deleting = false;
      },
      error: () => {
        this.toast('Failed to delete candidate');
        this.deleting = false;
      }
    });
  }

  // ── Skill breakdown ────────────────────────────────────────────────────
  rankingFor(candidateId: string): RankingView | undefined {
    return this.rankings.find(r => r.candidateId === candidateId);
  }

  parsedBreakdown(r: RankingView): { matched: string[]; missing: string[]; transferable: string[] } | null {
    if (!r.skillBreakdown) return null;
    if (typeof r.skillBreakdown === 'object') return r.skillBreakdown as any;
    try { return JSON.parse(r.skillBreakdown as string); } catch { return null; }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  jobTitle(jobId: string): string {
    return this.jobs.find(j => j.id === jobId)?.title ?? '—';
  }

  scoreBarColor(score?: number): string {
    if (!score) return 'var(--text-tertiary)';
    return score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--orange)' : 'var(--red)';
  }

  stageBadgeClass(s: PipelineStage): string { return `stage-${s.toLowerCase()}`; }
  statusBadgeClass(status?: string): string { return `status-${(status || 'new').toLowerCase()}`; }

  toggleExpand(id: string): void {
    this.expandedCandidateId = this.expandedCandidateId === id ? null : id;
  }

  isRecommended(c: Candidate): boolean {
    const r = this.rankingFor(c.id);
    if (!r || r.llmScore == null) return false;
    const job = this.jobs.find(j => j.id === c.jobId);
    const threshold = job?.autoScoreThreshold ?? 60;
    return r.llmScore >= threshold;
  }

  toast(msg: string): void {
    this.toastMsg = msg;
    setTimeout(() => this.toastMsg = '', 3000);
  }
}
