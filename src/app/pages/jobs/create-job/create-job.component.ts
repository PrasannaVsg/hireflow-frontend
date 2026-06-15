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
  private router     = inject(Router);

  saving = false;

  form: CreateJobRequest = {
    title: '',
    jobCode: '',
    description: '',
    clientName: '',
    locations: [],
    seniority: 'SENIOR',
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

  seniorities: Seniority[] = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];
  tones: EmailTone[]        = ['PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL'];

  // Location multi-select state
  locationSearch = '';
  showLocationDropdown = false;

  readonly allCities: string[] = [
    'Remote', 'Hybrid',
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune',
    'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Coimbatore', 'Madurai', 'Thiruvananthapuram', 'Kochi', 'Noida',
    'Gurgaon', 'Chandigarh', 'Bhubaneswar', 'Mangalore', 'Mysore',
    'Ranchi', 'Guwahati', 'Amritsar', 'Jabalpur', 'Raipur',
    'Vijayawada', 'Jodhpur', 'Aurangabad', 'Srinagar', 'Dehradun',
    'Hubli', 'Bareilly', 'Allahabad', 'Moradabad', 'Gwalior',
    'Tiruchirappalli', 'Vellore', 'Warangal', 'Bikaner', 'Amravati',
    'Navi Mumbai', 'Kolhapur', 'Jammu', 'Shimla', 'Panaji',
    'Dubai', 'Singapore', 'USA'
  ];

  get filteredCities(): string[] {
    const q = this.locationSearch.toLowerCase().trim();
    return q
      ? this.allCities.filter(c => c.toLowerCase().includes(q) && !this.form.locations.includes(c))
      : this.allCities.filter(c => !this.form.locations.includes(c));
  }

  toggleLocation(city: string): void {
    const idx = this.form.locations.indexOf(city);
    if (idx >= 0) {
      this.form.locations.splice(idx, 1);
    } else {
      this.form.locations.push(city);
      this.locationSearch = '';
    }
  }

  removeLocation(city: string): void {
    this.form.locations = this.form.locations.filter(l => l !== city);
  }

  closeLocationDropdown(): void {
    setTimeout(() => { this.showLocationDropdown = false; }, 150);
  }

  toggleAuto(): void {
    this.form.autoProcessEnabled = !this.form.autoProcessEnabled;
  }

  saveAsDraft(): void {
    this.saving = true;
    this.jobService.create(this.form).subscribe({
      next: () => this.router.navigate(['/jobs']),
      error: () => { this.saving = false; this.router.navigate(['/jobs']); }
    });
  }

  publish(): void {
    this.saving = true;
    this.jobService.create(this.form).subscribe({
      next: job => {
        this.jobService.publish(job.id).subscribe({
          next: () => this.router.navigate(['/candidates', job.id]),
          error: () => this.router.navigate(['/jobs'])
        });
      },
      error: () => { this.saving = false; this.router.navigate(['/jobs']); }
    });
  }
}
