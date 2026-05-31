import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  
  private readonly baseUrl = 'http://localhost:3000/api/attendance';
  private readonly facultyUrl = 'http://localhost:3000/api/faculty';

  // 1. Session Operations
  startSession(facultyId: number, subjectId: number, durationMinutes: number): Observable<any> {
    return this.http.post<any>(`${this.facultyUrl}/session/start`, { facultyId, subjectId, durationMinutes });
  }

  closeSession(sessionId: number): Observable<any> {
    return this.http.put<any>(`${this.facultyUrl}/session/close/${sessionId}`, {});
  }

  getActiveFacultySessions(facultyId: number): Observable<any> {
    return this.http.get<any>(`${this.facultyUrl}/session/active/${facultyId}`);
  }

  // 2. Attendance Marking Operations
  markAttendance(payload: { sessionId: number; studentId: number; status?: string; markedBy?: string; verificationScore?: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/mark`, payload);
  }

  // Submit 128-dimensional embedding array to server-side Euclidean distance matching
  recognizeAndMark(sessionId: number, embedding: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/recognize-and-mark`, { sessionId, embedding });
  }

  markByQRCode(qrCodeToken: string, studentId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/mark-qr`, { qrCodeToken, studentId });
  }

  // Retrieve classroom real-time active list
  getSessionLiveRoster(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/session/roster/${sessionId}`);
  }

  // 3. Correction requests
  submitCorrectionRequest(attendanceId: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/corrections/submit`, { attendanceId, reason });
  }

  getPendingCorrections(facultyId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/corrections/pending/${facultyId}`);
  }

  reviewCorrectionRequest(correctionId: number, status: 'approved' | 'rejected', facultyId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/corrections/review/${correctionId}`, { status, facultyId });
  }

  // 4. Historical reports
  getAttendanceReports(filters: { studentId?: number; subjectId?: number; startDate?: string; endDate?: string; departmentId?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters.studentId) params = params.set('studentId', filters.studentId.toString());
    if (filters.subjectId) params = params.set('subjectId', filters.subjectId.toString());
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.departmentId) params = params.set('departmentId', filters.departmentId.toString());

    return this.http.get<any>(`${this.baseUrl}/reports`, { params });
  }
}
