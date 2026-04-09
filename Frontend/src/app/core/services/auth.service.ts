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
    // Prevenir navegación hacia atrás
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.preventBack.bind(this));
    }
  }

  private preventBack(event: PopStateEvent): void {
    // Si el usuario está autenticado, prevenir que vuelva atrás
    if (this._isAuthenticated()) {
      history.pushState(null, '', window.location.href);
      // Forzar redirección al dashboard si intenta volver
      if (!window.location.pathname.includes('/dashboard') && 
          !window.location.pathname.includes('/admin') &&
          window.location.pathname !== '/') {
        this.redirectByRole();
      }
    }
  }

  private checkStoredAuth(): void {
    // Primero verificar cookies (prioridad)
    const cookieUser = this.getCookie('user');
    if (cookieUser) {
      try {
        const user = JSON.parse(cookieUser);
        this._user.set(user);
        this._isAuthenticated.set(true);
        return;
      } catch {
        this.deleteCookie('user');
      }
    }

    // Fallback a localStorage
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._user.set(user);
        this._isAuthenticated.set(true);
        // Sincronizar con cookie
        this.setCookie('user', stored, 7); // 7 días
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
            const userString = JSON.stringify(userData);
            
            this._user.set(userData);
            this._isAuthenticated.set(true);
            
            // Guardar en cookie (7 días) y localStorage
            this.setCookie('user', userString, 7);
            localStorage.setItem('user', userString);
            
            // Reemplazar historial para prevenir volver atrás sin autenticación
            history.replaceState(null, '', window.location.href);
            
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
    this.deleteCookie('user');
    localStorage.removeItem('user');
    // Reemplazar historial para prevenir volver atrás
    history.replaceState(null, '', '/login');
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

  // ============ Cookie Helpers ============
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    // Usar SameSite=Lax para compatibilidad con Cloudflare
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let c = cookies[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}