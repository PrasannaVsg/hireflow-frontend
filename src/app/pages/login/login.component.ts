import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);

  email    = '';
  password = '';
  loading  = false;
  error    = '';
  sessionExpired = this.route.snapshot.queryParamMap.get('expired') === '1';

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error   = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.mustChangePassword) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 401
          ? 'Invalid email or password.'
          : 'Login failed. Make sure the backend is running.';
      }
    });
  }
}
