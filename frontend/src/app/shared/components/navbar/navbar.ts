import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  protected readonly authService = inject(AuthService);
  
  // Theme state signal
  isDarkMode = signal<boolean>(true);
  
  // Date time string
  currentDateTime = signal<string>('');

  ngOnInit(): void {
    this.updateTime();
    setInterval(() => this.updateTime(), 60000); // Update every minute
  }

  toggleTheme(): void {
    const body = document.body;
    if (this.isDarkMode()) {
      body.classList.add('light-theme');
      this.isDarkMode.set(false);
    } else {
      body.classList.remove('light-theme');
      this.isDarkMode.set(true);
    }
  }

  private updateTime(): void {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    this.currentDateTime.set(new Date().toLocaleDateString('en-US', options));
  }
}
