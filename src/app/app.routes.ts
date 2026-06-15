import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'jobs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/jobs/jobs.component').then(m => m.JobsComponent)
  },
  {
    path: 'jobs/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/jobs/create-job/create-job.component').then(m => m.CreateJobComponent)
  },
  {
    path: 'candidates',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/candidates/candidates.component').then(m => m.CandidatesComponent)
  },
  {
    path: 'candidates/:jobId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/candidates/candidates.component').then(m => m.CandidatesComponent)
  },
  {
    path: 'pipeline',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pipeline/pipeline.component').then(m => m.PipelineComponent)
  },
  {
    path: 'outreach',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/outreach/outreach.component').then(m => m.OutreachComponent)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/audit/audit.component').then(m => m.AuditComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
