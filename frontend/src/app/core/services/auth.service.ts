import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  
  // Reactive Signal representing current authenticated user profile
  public readonly currentUser = signal<any>(null);

  constructor() {
    this.initializeUser();
  }

  // Load user details cached in localStorage
  private initializeUser(): void {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');

    if (token && cachedUser) {
      try {
        this.currentUser.set(JSON.parse(cachedUser));
      } catch (e) {
        this.logout();
      }
    }
  }

  // Submit Login credentials
  login(credentials: { usernameOrEmail: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  // Register New User (Transactional endpoint)
  register(profileData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, profileData);
  }

  // Purge Session
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // Utility checkers
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') && this.currentUser() !== null;
  }

  getUserRole(): string {
    const user = this.currentUser();
    return user ? user.role : '';
  }

  getUserProfile(): any {
    const user = this.currentUser();
    return user ? user.profile : null;
  }
}
