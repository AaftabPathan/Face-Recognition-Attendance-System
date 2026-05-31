import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-faculty',
  standalone: true,
  imports: [Sidebar, Navbar, RouterLink, FormsModule],
  templateUrl: './faculty.html',
  styleUrl: './faculty.css'
})
export class AdminFaculty implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  loading = signal<boolean>(true);
  facultyList = signal<any[]>([]);
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.loadFaculty();
  }

  loadFaculty(): void {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/faculty').subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.facultyList.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Failed to load faculty profiles.');
        console.error(err);
      }
    });
  }

  filteredFaculty(): any[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.facultyList();
    }
    
    return this.facultyList().filter(f => 
      f.first_name.toLowerCase().includes(query) ||
      f.last_name.toLowerCase().includes(query) ||
      f.employee_id.toLowerCase().includes(query) ||
      f.email.toLowerCase().includes(query) ||
      f.department_name.toLowerCase().includes(query)
    );
  }

  deleteFaculty(id: number): void {
    if (!confirm('Are you absolutely sure you want to delete this faculty member? This will permanently revoke their class schedule and dashboard privileges.')) {
      return;
    }

    this.http.delete<any>(`http://localhost:3000/api/faculty/${id}`).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Faculty profile erased successfully.');
          this.loadFaculty();
        }
      },
      error: err => {
        this.toast.error('Failed to delete faculty member.');
        console.error(err);
      }
    });
  }
}
