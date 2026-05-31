import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/students';

  // Retrieve list of all student profiles
  getAllStudents(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Retrieve single student details and active templates
  getStudentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Save student updates
  updateStudent(id: number, data: { firstName: string; lastName: string; departmentId: number; courseId: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  // Admin delete student
  deleteStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Ingest captured base64 canvas snapshot and float embeddings
  registerFaceEmbeddings(payload: { studentId: number; embeddings: number[][]; imageBase64: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register-face`, payload);
  }

  // Retrieve departments, courses, and subjects list
  getMetadataLists(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/meta/lists`);
  }
}
