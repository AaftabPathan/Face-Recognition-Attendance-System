import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { StudentService } from '../../../core/services/student.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-faculty-reports',
  standalone: true,
  imports: [Sidebar, Navbar, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class FacultyReports implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly studentService = inject(StudentService);
  
  protected readonly Math = Math;

  private readonly toast = inject(ToastService);

  loading = signal<boolean>(false);
  subjects = signal<any[]>([]);
  reports = signal<any[]>([]);

  // Filter queries
  filterSubject = '';
  filterStartDate = '';
  filterEndDate = '';

  ngOnInit(): void {
    this.loadSubjects();
    this.applyFilters();
  }

  private loadSubjects(): void {
    this.studentService.getMetadataLists().subscribe({
      next: res => {
        if (res.success) {
          this.subjects.set(res.subjects);
        }
      }
    });
  }

  applyFilters(): void {
    this.loading.set(true);
    const filters: any = {};
    if (this.filterSubject) filters.subjectId = Number(this.filterSubject);
    if (this.filterStartDate) filters.startDate = this.filterStartDate;
    if (this.filterEndDate) filters.endDate = this.filterEndDate;

    this.attendanceService.getAttendanceReports(filters).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.reports.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Failed to compile attendance reports.');
      }
    });
  }

  clearFilters(): void {
    this.filterSubject = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.applyFilters();
  }

  // Client-Side CSV Exporter
  exportToCSV(): void {
    if (this.reports().length === 0) {
      this.toast.warning('No historical logs available to export.');
      return;
    }

    const headers = ['Roll Number', 'Full Name', 'Subject Class', 'Class Code', 'Log Date', 'Arrival Time', 'Biometric Score', 'Status', 'Marked By'];
    const rows = this.reports().map(r => [
      r.roll_number,
      `${r.first_name} ${r.last_name}`,
      r.subject_name,
      r.subject_code,
      r.date.slice(0, 10),
      r.start_time,
      r.verification_score !== null ? r.verification_score.toFixed(3) : 'N/A',
      r.status,
      r.marked_by
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Biometric_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toast.success('Attendance report exported successfully as CSV!');
  }
}
