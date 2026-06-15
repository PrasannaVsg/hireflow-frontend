import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '@env/environment';

interface IMannerEvent {
  event_type: string;
  application_id: string;
  application_name: string;
  org_id: string;
  project_id: string;
  environment: string;
  model_provider: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  trace_id: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class IMannerService implements OnDestroy {
  private queue: IMannerEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly cfg = environment.obs;

  constructor() {
    if (this.cfg?.enabled) {
      this.flushTimer = setInterval(() => this.flush(), 2000);
    }
  }

  record(modelProvider: string, modelName: string, durationMs: number, success: boolean): void {
    if (!this.cfg?.enabled) return;
    if (this.cfg.samplingRate < 1.0 && Math.random() > this.cfg.samplingRate) return;
    if (this.queue.length >= 200) return; // drop if full, never block

    try {
      this.queue.push({
        event_type: 'generation',
        application_id: this.cfg.applicationId,
        application_name: this.cfg.applicationName,
        org_id: this.cfg.orgId,
        project_id: this.cfg.projectId,
        environment: this.cfg.environment,
        model_provider: modelProvider,
        model_name: modelName,
        input_tokens: 0,
        output_tokens: 0,
        duration_ms: Math.round(durationMs),
        trace_id: crypto.randomUUID(),
        status: success ? 'completed' : 'error'
      });
    } catch { /* never throw */ }
  }

  private flush(): void {
    if (!this.queue.length) return;
    const batch = this.queue.splice(0, 20);

    fetch(`${this.cfg.apiEndpoint}/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.cfg.apiKey}`
      },
      body: JSON.stringify({ events: batch }),
      keepalive: true
    }).then(res => {
      if (res.status >= 500) {
        // re-queue on server error, drop 4xx silently
        this.queue.unshift(...batch);
      }
    }).catch(() => { /* network failure — silently drop */ });
  }

  ngOnDestroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flush(); // best-effort final flush
  }
}
