import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';
  loading  = false;
  error    = '';
  success  = false;

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  get tooShort(): boolean {
    return this.newPassword.length > 0 && this.newPassword.length < 10;
  }

  get canSubmit(): boolean {
    return !!this.currentPassword && !!this.newPassword && !!this.confirmPassword
        && !this.passwordMismatch && !this.tooShort;
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.loading = true;
    this.error   = '';
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        // Clear stored tokens — user must log in again with new password
        localStorage.removeItem('hf_token');
        localStorage.removeItem('hf_refresh');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 401
          ? 'Current password is incorrect.'
          : 'Failed to change password. Please try again.';
      }
    });
  }
}
