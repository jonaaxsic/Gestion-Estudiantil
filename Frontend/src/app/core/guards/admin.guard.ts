import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Verificación rápida síncrona - el AuthService ya tiene los datos cargados del constructor
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

// Guards para docente y apoderado
export const docenteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isDocente()) {
    return true;
  }

  if (auth.isAuthenticated()) {
    auth.redirectByRole();
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export const apoderadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isApoderado()) {
    return true;
  }

  if (auth.isAuthenticated()) {
    auth.redirectByRole();
  } else {
    router.navigate(['/login']);
  }
  return false;
};
