import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, AppUser, CreateUserRequest } from '../../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);

  users: AppUser[] = [];
  loading = true;
  showForm = false;
  saving = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  form: CreateUserRequest = { email: '', fullName: '', role: 'RECRUITER' };
  formError = '';

  // Reset password (admin)
  resetTarget: AppUser | null = null;
  resetPassword = '';
  resetSaving = false;
  resetError = '';

  // Change own password
  showChangePassword = false;
  cpCurrent = '';
  cpNew = '';
  cpConfirm = '';
  cpSaving = false;
  cpError = '';

  roles: AppUser['role'][] = ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'READ_ONLY'];

  readonly DEFAULT_PASSWORD = 'Welcome@2026';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.list().subscribe({
      next: p  => { this.users = p.content; this.loading = false; },
      error: () => { this.users = []; this.loading = false; }
    });
  }

  openForm(): void {
    this.form = { email: '', fullName: '', role: 'RECRUITER' };
    this.formError = '';
    this.showForm = true;
  }

  cancelForm(): void { this.showForm = false; }

  createUser(): void {
    if (!this.form.email || !this.form.fullName) {
      this.formError = 'Name and email are required.';
      return;
    }
    this.saving = true;
    this.formError = '';
    this.userService.create(this.form).subscribe({
      next: user => {
        this.users.unshift(user);
        this.showForm = false;
        this.saving = false;
        this.toast(`User ${user.fullName} created. Default password: ${this.DEFAULT_PASSWORD}`, 'success');
      },
      error: err => {
        this.saving = false;
        this.formError = err.error?.message ?? 'Failed to create user.';
      }
    });
  }

  disableUser(user: AppUser): void {
    this.userService.disable(user.id).subscribe({
      next: updated => { Object.assign(user, updated); this.toast(`${user.fullName} disabled`, 'success'); },
      error: () => this.toast('Failed to disable user', 'error')
    });
  }

  enableUser(user: AppUser): void {
    this.userService.enable(user.id).subscribe({
      next: updated => { Object.assign(user, updated); this.toast(`${user.fullName} re-enabled`, 'success'); },
      error: () => this.toast('Failed to enable user', 'error')
    });
  }

  openResetPassword(user: AppUser): void {
    this.resetTarget = user;
    this.resetPassword = '';
    this.resetError = '';
  }

  confirmResetPassword(): void {
    if (!this.resetTarget || !this.resetPassword) return;
    if (this.resetPassword.length < 8) { this.resetError = 'Password must be at least 8 characters.'; return; }
    this.resetSaving = true;
    this.userService.resetPassword(this.resetTarget.id, this.resetPassword).subscribe({
      next: () => {
        this.resetSaving = false;
        this.resetTarget = null;
        this.toast('Password reset successfully. User must change it on next login.', 'success');
      },
      error: () => { this.resetSaving = false; this.resetError = 'Failed to reset password.'; }
    });
  }

  openChangePassword(): void {
    this.showChangePassword = true;
    this.cpCurrent = ''; this.cpNew = ''; this.cpConfirm = ''; this.cpError = '';
  }

  submitChangePassword(): void {
    if (!this.cpCurrent || !this.cpNew || !this.cpConfirm) { this.cpError = 'All fields are required.'; return; }
    if (this.cpNew.length < 8) { this.cpError = 'New password must be at least 8 characters.'; return; }
    if (this.cpNew !== this.cpConfirm) { this.cpError = 'New passwords do not match.'; return; }
    this.cpSaving = true;
    this.userService.changePassword(this.cpCurrent, this.cpNew).subscribe({
      next: () => {
        this.cpSaving = false;
        this.showChangePassword = false;
        this.toast('Password changed successfully', 'success');
      },
      error: err => {
        this.cpSaving = false;
        this.cpError = err?.error?.message ?? 'Failed to change password.';
      }
    });
  }

  roleLabel(role: AppUser['role']): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin', ORG_ADMIN: 'Admin',
      RECRUITER: 'Recruiter', HIRING_MANAGER: 'Hiring Manager', READ_ONLY: 'Read Only'
    };
    return map[role] ?? role;
  }

  roleBadgeClass(role: AppUser['role']): string {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'role-super', ORG_ADMIN: 'role-admin',
      RECRUITER: 'role-recruiter', HIRING_MANAGER: 'role-manager', READ_ONLY: 'role-viewer'
    };
    return map[role] ?? '';
  }

  toast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMsg = msg;
    this.toastType = type;
    setTimeout(() => this.toastMsg = '', 4000);
  }
}
