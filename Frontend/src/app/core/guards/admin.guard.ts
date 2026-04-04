import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isAdmin()) {
    return true;
  }

  // Redirigir según el rol
  if (auth.isAuthenticated()) {
    auth.redirectByRole();
  } else {
    router.navigate(['/login']);
  }
  return false;
};
