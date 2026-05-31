import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Toggle between login and registration panels
  isLoginMode = signal<boolean>(true);
  loading = signal<boolean>(false);

  // Dropdown lists
  departments = signal<any[]>([]);
  courses = signal<any[]>([]);

  // Login parameters
  usernameOrEmail = '';
  password = '';

  // Register parameters
  regUsername = '';
  regEmail = '';
  regPassword = '';
  regRole: 'student' | 'faculty' = 'student';
  regFirstName = '';
  regLastName = '';
  regRollNumber = '';
  regEmployeeId = '';
  regDepartmentId = '';
  regCourseId = '';

  ngOnInit(): void {
    this.fetchMetadata();
  }

  // Load backend lists on startup for forms
  private fetchMetadata(): void {
    this.studentService.getMetadataLists().subscribe({
      next: res => {
        if (res.success) {
          this.departments.set(res.departments);
          this.courses.set(res.courses);
        }
      },
      error: err => {
        console.error('Failed to retrieve forms lists:', err);
      }
    });
  }

  // Handle Login Authentication
  onLogin(event: Event): void {
    event.preventDefault();
    if (!this.usernameOrEmail || !this.password) {
      this.toast.warning('Please fill in all credentials fields.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ usernameOrEmail: this.usernameOrEmail, password: this.password }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.toast.success(`Welcome back, ${res.user.username}!`);
          this.redirectByRole(res.user.role);
        }
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Login failed. Please verify credentials.');
      }
    });
  }

  // Handle Registration Onboarding
  onRegister(event: Event): void {
    event.preventDefault();
    
    // Core fields validation
    if (!this.regUsername || !this.regEmail || !this.regPassword || !this.regFirstName || !this.regLastName || !this.regDepartmentId) {
      this.toast.warning('Please fill in all core user fields.');
      return;
    }

    // Role specific validations
    if (this.regRole === 'student' && (!this.regRollNumber || !this.regCourseId)) {
      this.toast.warning('Please fill in all student profile parameters.');
      return;
    }
    if (this.regRole === 'faculty' && !this.regEmployeeId) {
      this.toast.warning('Please input your faculty employee identifier.');
      return;
    }

    const payload: any = {
      username: this.regUsername,
      email: this.regEmail,
      password: this.regPassword,
      role: this.regRole,
      firstName: this.regFirstName,
      lastName: this.regLastName,
      departmentId: Number(this.regDepartmentId)
    };

    if (this.regRole === 'student') {
      payload.rollNumber = this.regRollNumber;
      payload.courseId = Number(this.regCourseId);
    } else {
      payload.employeeId = this.regEmployeeId;
    }

    this.loading.set(true);
    this.authService.register(payload).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.toast.success('Registration successful! Please sign in.');
          this.isLoginMode.set(true);
          this.clearRegForm();
        }
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Registration failed. Try a different username/email.');
      }
    });
  }

  private redirectByRole(role: string): void {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'faculty') {
      this.router.navigate(['/faculty']);
    } else if (role === 'student') {
      this.router.navigate(['/student']);
    }
  }

  private clearRegForm(): void {
    this.regUsername = '';
    this.regEmail = '';
    this.regPassword = '';
    this.regFirstName = '';
    this.regLastName = '';
    this.regRollNumber = '';
    this.regEmployeeId = '';
    this.regDepartmentId = '';
    this.regCourseId = '';
  }
}
