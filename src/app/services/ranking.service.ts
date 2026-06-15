import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Ranking, PageResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private http = inject(HttpClient);

  run(jobId: string, shortlistSize = 10): Observable<Ranking[]> {
    const params = new HttpParams().set('shortlistSize', shortlistSize);
    return this.http.post<Ranking[]>(
      `${environment.apiBase}/jobs/${jobId}/rankings/run`,
      {},
      { params }
    );
  }

  rankSingle(jobId: string, candidateId: string): Observable<Ranking> {
    return this.http.post<Ranking>(
      `${environment.apiBase}/jobs/${jobId}/rankings/candidate/${candidateId}`,
      {}
    );
  }

  list(jobId: string, page = 0, size = 50): Observable<PageResponse<Ranking>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Ranking>>(
      `${environment.apiBase}/jobs/${jobId}/rankings`,
      { params }
    );
  }
}
