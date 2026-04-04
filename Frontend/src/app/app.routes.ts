import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
    canActivate: [adminGuard],
  },
  {
    path: 'dashboard-docente',
    loadComponent: () => import('./pages/dashboard-docente/dashboard-docente.page').then(m => m.DashboardDocentePage),
  },
  {
    path: 'dashboard-apoderado',
    loadComponent: () => import('./pages/dashboard-apoderado/dashboard-apoderado.page').then(m => m.DashboardApoderadoPage),
  },
];
