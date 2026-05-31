import { Component, OnInit, inject, signal } from '@angular/core';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-faculty-corrections',
  standalone: true,
  imports: [Sidebar, Navbar],
  templateUrl: './corrections.html',
  styleUrl: './corrections.css'
})
export class FacultyCorrections implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  loading = signal<boolean>(true);
  corrections = signal<any[]>([]);

  ngOnInit(): void {
    this.loadCorrections();
  }

  loadCorrections(): void {
    const faculty = this.authService.getUserProfile();
    if (!faculty) return;

    this.loading.set(true);
    this.attendanceService.getPendingCorrections(faculty.id).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.corrections.set(res.corrections);
        }
      },
      error: err => {
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  approveCorrection(id: number): void {
    const faculty = this.authService.getUserProfile();
    if (!faculty) return;

    this.attendanceService.reviewCorrectionRequest(id, 'approved', faculty.id).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Correction request approved! Attendance record updated.');
          this.loadCorrections();
        }
      }
    });
  }

  rejectCorrection(id: number): void {
    const faculty = this.authService.getUserProfile();
    if (!faculty) return;

    this.attendanceService.reviewCorrectionRequest(id, 'rejected', faculty.id).subscribe({
      next: res => {
        if (res.success) {
          this.toast.warning('Correction request rejected.');
          this.loadCorrections();
        }
      }
    });
  }
}
