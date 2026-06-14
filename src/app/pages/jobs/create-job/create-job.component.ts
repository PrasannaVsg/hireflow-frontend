import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { CreateJobRequest, Seniority, EmailTone } from '../../../models/models';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.scss']
})
export class CreateJobComponent {
  private jobService = inject(JobService);
  private router = inject(Router);

  saving = false;

  form: CreateJobRequest = {
    title: '',
    location: '',
    seniority: 'SENIOR',

    requiredSkills: '',
    description: '',
    shortlistSize: 10,
    scoreThreshold: 60,
    emailTone: 'PROFESSIONAL',
    autoProcessEnabled: false
  };

  seniorities: Seniority[] = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];
  tones: EmailTone[] = ['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL'];

  toggleAuto(): void {
    this.form.autoProcessEnabled = !this.form.autoProcessEnabled;
  }

  saveAsDraft(): void {
    this.saving = true;
    this.jobService.create(this.form).subscribe({
      next: () => this.router.navigate(['/jobs']),
      error: ()  => { this.saving = false; this.router.navigate(['/jobs']); }
    });
  }

  publish(): void {
    this.saving = true;
    this.jobService.create(this.form).subscribe({
      next: job => {
        this.jobService.publish(job.id).subscribe({
          next: () => this.router.navigate(['/candidates', job.id]),
          error: ()  => this.router.navigate(['/jobs'])
        });
      },
      error: () => { this.saving = false; this.router.navigate(['/jobs']); }
    });
  }
}
