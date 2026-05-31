import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const expectedRoles = route.data['roles'] as string[];
    
    // Check if route has restricted roles
    if (expectedRoles && expectedRoles.length > 0) {
      const userRole = authService.getUserRole();
      if (!expectedRoles.includes(userRole)) {
        // Role not permitted, redirect to home profile
        router.navigate(['/']);
        return false;
      }
    }
    return true;
  }

  // Not authenticated, redirect to login screen
  router.navigate(['/login']);
  return false;
};
