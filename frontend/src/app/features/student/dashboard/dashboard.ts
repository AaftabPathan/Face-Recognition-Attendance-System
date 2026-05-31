import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [Sidebar, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class StudentDashboard implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly authService = inject(AuthService);

  loading = signal<boolean>(true);
  
  // Stats cards
  overallRate = signal<number>(0);
  classesAttended = signal<number>(0);
  classesTotal = signal<number>(0);

  // Subject details
  subjectOverview = signal<any[]>([]);

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    const student = this.authService.getUserProfile();
    if (!student) return;

    this.loading.set(true);
    this.analyticsService.getStudentSubjectOverview(student.id).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.subjectOverview.set(res.data);
          
          // Calculate aggregate scores
          let totalAttended = 0;
          let totalClasses = 0;
          
          res.data.forEach((sub: any) => {
            totalAttended += sub.attendedClasses;
            totalClasses += sub.totalClasses;
          });

          this.classesAttended.set(totalAttended);
          this.classesTotal.set(totalClasses);
          
          const rate = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
          this.overallRate.set(rate);
        }
      },
      error: err => {
        this.loading.set(false);
        console.error(err);
      }
    });
  }
}
