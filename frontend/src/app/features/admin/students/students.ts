import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { ToastService } from '../../../core/services/toast.service';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [Sidebar, Navbar, RouterLink, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.css'
})
export class AdminStudents implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly toast = inject(ToastService);

  loading = signal<boolean>(true);
  
  // Entire students list
  students = signal<any[]>([]);
  
  // Search parameters
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.studentService.getAllStudents().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.students.set(res.data);
        }
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Failed to load student profiles.');
        console.error(err);
      }
    });
  }

  // Filter student profiles by search term
  filteredStudents(): any[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.students();
    }
    
    return this.students().filter(s => 
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query) ||
      s.roll_number.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.department_code.toLowerCase().includes(query)
    );
  }

  // Administrative Purge command
  deleteStudent(id: number): void {
    if (!confirm('Are you absolutely sure you want to delete this student profile? This will permanently erase their credentials, attendance history, and registered biometric templates.')) {
      return;
    }

    this.studentService.deleteStudent(id).subscribe({
      next: res => {
        if (res.success) {
          this.toast.success('Student profile purged successfully.');
          this.loadStudents(); // Reload active database sheet
        }
      },
      error: err => {
        this.toast.error('Failed to delete student.');
        console.error(err);
      }
    });
  }
}
