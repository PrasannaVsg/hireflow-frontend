import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('hf_token');

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        // Token expired or invalid — clear session and go to login
        localStorage.removeItem('hf_token');
        localStorage.removeItem('hf_refresh');
        router.navigate(['/login'], { queryParams: { expired: '1' } });
      }
      return throwError(() => err);
    })
  );
};
