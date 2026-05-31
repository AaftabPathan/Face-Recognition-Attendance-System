import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [Sidebar, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  
  protected readonly Math = Math;

  loading = signal<boolean>(true);

  // Stats signals
  totalStudents = signal<number>(0);
  totalFaculty = signal<number>(0);
  activeSessions = signal<number>(0);
  totalDepartments = signal<number>(0);
  overallAttendanceRate = signal<number>(0);

  // Today live logs summary
  todayPresent = signal<number>(0);
  todayAbsent = signal<number>(0);
  todayLate = signal<number>(0);
  todayTotal = signal<number>(0);

  // Performance datasets
  departmentStats = signal<any[]>([]);
  subjectStats = signal<any[]>([]);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    // Parallel subscription triggers
    this.analyticsService.getSystemOverviewStats().subscribe({
      next: res => {
        if (res.success) {
          const stats = res.stats;
          this.totalStudents.set(stats.totalStudents);
          this.totalFaculty.set(stats.totalFaculty);
          this.activeSessions.set(stats.activeSessions);
          this.totalDepartments.set(stats.totalDepartments);
          this.overallAttendanceRate.set(stats.overallAttendanceRate);
        }
      }
    });

    this.analyticsService.getTodayLiveAttendance().subscribe({
      next: res => {
        if (res.success && res.stats) {
          const s = res.stats;
          this.todayPresent.set(s.present || 0);
          this.todayAbsent.set(s.absent || 0);
          this.todayLate.set(s.late || 0);
          this.todayTotal.set(s.total || 0);
        }
      }
    });

    this.analyticsService.getDepartmentAnalytics().subscribe({
      next: res => {
        if (res.success) {
          this.departmentStats.set(res.data);
        }
      }
    });

    this.analyticsService.getSubjectAnalytics().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.subjectStats.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        console.error('Failed to load dashboard:', err);
      }
    });
  }
}
