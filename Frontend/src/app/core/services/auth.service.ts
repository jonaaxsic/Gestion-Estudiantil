import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Usuario } from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // Signals para estado reactivo
  private _user = signal<Usuario | null>(null);
  private _isAuthenticated = signal(false);
  private _isLoading = signal(false);

  // Computed values
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isDocente = computed(() => this._user()?.rol === 'docente');
  readonly isApoderado = computed(() => this._user()?.rol === 'apoderado');
  readonly isAdmin = computed(() => this._user()?.rol === 'administrador');

  constructor() {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._user.set(user);
        this._isAuthenticated.set(true);
      } catch {
        this.logout();
      }
    }
  }

  login(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    
    return new Promise((resolve) => {
      this.api.login(email, password).subscribe({
        next: (response) => {
          if (response.success && response.user) {
            // Ensure rut field is saved properly
            const userData = {
              ...response.user,
              rut: response.user.rut || undefined
            };
            this._user.set(userData);
            this._isAuthenticated.set(true);
            localStorage.setItem('user', JSON.stringify(userData));
            this._isLoading.set(false);
            resolve(true);
          } else {
            this._isLoading.set(false);
            resolve(false);
          }
        },
        error: () => {
          this._isLoading.set(false);
          resolve(false);
        },
      });
    });
  }

  logout(): void {
    this._user.set(null);
    this._isAuthenticated.set(false);
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  redirectByRole(): void {
    const user = this._user();
    if (user?.rol === 'docente') {
      this.router.navigate(['/dashboard-docente']);
    } else if (user?.rol === 'apoderado') {
      this.router.navigate(['/dashboard-apoderado']);
    } else if (user?.rol === 'administrador') {
      this.router.navigate(['/admin']);
    }
  }
}
