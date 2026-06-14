// ── Enums ──────────────────────────────────────────────────────────────────

export type JobStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'ARCHIVED';
export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER';
export type PipelineStage = 'SOURCED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
export type CandidateSource = 'LINKEDIN' | 'NAUKRI' | 'INDEED' | 'INTERNSHALA' | 'REFERRAL' | 'DIRECT' | 'OTHER';
export type EmailTone = 'PROFESSIONAL' | 'FRIENDLY' | 'CASUAL' | 'FORMAL';
export type OutreachStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'REJECTED';
export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'READ_ONLY';

// ── Job ────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  seniority: string;
  requiredSkills: string;
  status: JobStatus;
  autoProcessEnabled: boolean;
  autoShortlistSize: number;
  autoScoreThreshold: number;
  autoEmailTone: string;
  candidateCount?: number;
  createdAt?: string;
  createdByName?: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  seniority: string;
  requiredSkills: string;
  autoProcessEnabled: boolean;
  shortlistSize: number;
  scoreThreshold: number;
  emailTone: string;
}

// ── Candidate ──────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  source: CandidateSource;
  jobId: string;
  status?: string;
  pipelineStage: PipelineStage;
  jobTitle?: string;
  aiScore?: number;
  hasEmbedding?: boolean;
  createdAt?: string;
  createdByName?: string;
}

export interface CreateCandidateRequest {
  fullName: string;
  email: string;
  phone?: string;
  source: CandidateSource;
  jobId: string;
}

export interface BatchUploadResponse {
  jobId: string;
  fileCount: number;
  statusUrl: string;
}

// ── Ranking ────────────────────────────────────────────────────────────────

export interface Ranking {
  candidateId: string;
  candidateName: string;
  score: number;
  vectorSimilarity: number;
  llmScore: number | null;
  rationale: string;
  skillBreakdown: string | SkillBreakdown;
  claudeFailed?: boolean;
  claudeError?: string;
}

export interface SkillBreakdown {
  matched: string[];
  missing: string[];
  transferable: string[];
}

// ── Outreach ───────────────────────────────────────────────────────────────

export interface OutreachEmail {
  id: string;
  candidateId: string;
  jobId: string;
  subject: string;
  body: string;
  status: OutreachStatus;
  sentAt?: string;
  candidateName?: string;
  candidateEmail?: string;
}

// ── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  enabled: boolean;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: Role;
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface DashboardData {
  openRequisitions: number;
  activeCandidates: number;
  aiRankingsRun: number;
  outreachDrafted: number;
  hiringFunnel: Record<string, number>;
  aiUsage?: { totalTokens: number; byOperation: Record<string, number> };
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  operation: string;
  model: string;
  latencyMs: number;
  success: boolean;
  createdAt: string;
}

export interface AiUsageStats {
  rankingTokens: number;
  outreachTokens: number;
  embeddingTokens: number;
  rankingCost: number;
  outreachCost: number;
  embeddingCost: number;
  totalCost: number;
  weeklyBreakdown: WeeklyUsage[];
}

export interface WeeklyUsage {
  week: string;
  rankingTokens: number;
  outreachTokens: number;
  embeddingTokens: number;
}

// ── Audit ──────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  organisationId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

// ── API wrappers ───────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
