import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Reactive Signal of active toast items
  public readonly toasts = signal<ToastMessage[]>([]);
  private toastCounter = 0;

  show(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const id = ++this.toastCounter;
    const newToast: ToastMessage = { id, message, type };
    
    this.toasts.update(current => [...current, newToast]);

    // Auto-remove toast after 3.5 seconds
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 3500);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }
}
