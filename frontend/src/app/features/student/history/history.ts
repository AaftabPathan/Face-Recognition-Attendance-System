import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [Sidebar, Navbar, FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class StudentHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  loading = signal<boolean>(true);
  logs = signal<any[]>([]);

  // Modal portal states
  showModal = signal<boolean>(false);
  activeAttendanceId = signal<number | null>(null);
  correctionReason = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    const student = this.authService.getUserProfile();
    if (!student) return;

    this.loading.set(true);
    this.attendanceService.getAttendanceReports({ studentId: student.id }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.logs.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  openCorrectionModal(attendanceId: number): void {
    this.activeAttendanceId.set(attendanceId);
    this.correctionReason = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.activeAttendanceId.set(null);
  }

  submitCorrection(event: Event): void {
    event.preventDefault();
    if (!this.correctionReason.trim()) {
      this.toast.warning('Please describe the reason for adjustment.');
      return;
    }

    this.attendanceService.submitCorrectionRequest(
      this.activeAttendanceId()!, 
      this.correctionReason
    ).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Adjustment request filed successfully with faculty.');
          this.closeModal();
          this.loadLogs(); // Refresh status check
        }
      },
      error: err => {
        this.toast.error('Failed to file adjustment request.');
      }
    });
  }
}
