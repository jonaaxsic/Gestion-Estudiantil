import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const inspectorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isInspector()) {
    return true;
  }

  if (auth.isAuthenticated()) {
    auth.redirectByRole();
  } else {
    router.navigate(['/login']);
  }
  return false;
};
