import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/analytics';

  // Admin general overview counters
  getSystemOverviewStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/overview`);
  }

  // Today live logs summary
  getTodayLiveAttendance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/live-today`);
  }

  // Department comparative rates
  getDepartmentAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/department`);
  }

  // Subject attendance rates
  getSubjectAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subject`);
  }

  // Student specific dashboard reports
  getStudentSubjectOverview(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}`);
  }
}
