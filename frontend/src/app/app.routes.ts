import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { AdminDashboard } from './features/admin/dashboard/dashboard';
import { AdminStudents } from './features/admin/students/students';
import { AdminFaculty } from './features/admin/faculty/faculty';
import { FaceRegistration } from './features/admin/face-registration/face-registration';
import { FacultySession } from './features/faculty/session/session';
import { FacultyCorrections } from './features/faculty/corrections/corrections';
import { FacultyReports } from './features/faculty/reports/reports';
import { StudentDashboard } from './features/student/dashboard/dashboard';
import { StudentHistory } from './features/student/history/history';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public Login Onboarding Route
  { path: 'login', component: Auth },

  // Administrative Control Center Routes
  { 
    path: 'admin', 
    component: AdminDashboard, 
    canActivate: [authGuard], 
    data: { roles: ['admin'] } 
  },
  { 
    path: 'admin/students', 
    component: AdminStudents, 
    canActivate: [authGuard], 
    data: { roles: ['admin'] } 
  },
  { 
    path: 'admin/faculty', 
    component: AdminFaculty, 
    canActivate: [authGuard], 
    data: { roles: ['admin'] } 
  },
  { 
    path: 'admin/face-registration', 
    component: FaceRegistration, 
    canActivate: [authGuard], 
    data: { roles: ['admin'] } 
  },

  // Faculty Classrooms Control Routes
  { 
    path: 'faculty', 
    component: FacultySession, // Let Faculty Dashboard and Session start be closely unified
    canActivate: [authGuard], 
    data: { roles: ['faculty', 'admin'] } 
  },
  { 
    path: 'faculty/session', 
    component: FacultySession, 
    canActivate: [authGuard], 
    data: { roles: ['faculty', 'admin'] } 
  },
  { 
    path: 'faculty/corrections', 
    component: FacultyCorrections, 
    canActivate: [authGuard], 
    data: { roles: ['faculty', 'admin'] } 
  },
  { 
    path: 'faculty/reports', 
    component: FacultyReports, 
    canActivate: [authGuard], 
    data: { roles: ['faculty', 'admin'] } 
  },

  // Student Biometrics Portal Routes
  { 
    path: 'student', 
    component: StudentDashboard, 
    canActivate: [authGuard], 
    data: { roles: ['student'] } 
  },
  { 
    path: 'student/history', 
    component: StudentHistory, 
    canActivate: [authGuard], 
    data: { roles: ['student'] } 
  },

  // Wildcard default mappings redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
