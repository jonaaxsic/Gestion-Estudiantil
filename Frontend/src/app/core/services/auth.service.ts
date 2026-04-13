import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Usuario } from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  
  // Session timeout configuration
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas máximo
  private readonly INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos de inactividad
  
  private sessionStartTime = 0;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  // Signals para estado reactivo
  private _user = signal<Usuario | null>(null);
  private _isAuthenticated = signal(false);
  private _isLoading = signal(false);
  private _sessionWarning = signal<string | null>(null);

  // Computed values
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isDocente = computed(() => this._user()?.rol === 'docente');
  readonly isApoderado = computed(() => this._user()?.rol === 'apoderado');
  readonly isAdmin = computed(() => this._user()?.rol === 'administrador');
  readonly sessionWarning = this._sessionWarning.asReadonly();

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
        this.startSessionTimers();
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
        // Sincronizar con cookie (8 horas)
        this.setCookie('user', stored, 8 / 24); // 8 horas = 1/3 día
        this.startSessionTimers();
      } catch {
        this.logout();
      }
    }
  }

  private startSessionTimers(): void {
    this.sessionStartTime = Date.now();
    this.resetInactivityTimer();
    this.startSessionDurationTimer();
    this.registerActivityListeners();
  }

  private startSessionDurationTimer(): void {
    // Timer para duración máxima de sesión (8 horas)
    const remaining = this.SESSION_DURATION;
    
    // Mostrar warning a los 30 minutos de la última hora
    const warningTime = this.SESSION_DURATION - (30 * 60 * 1000);
    setTimeout(() => {
      if (this._isAuthenticated()) {
        this._sessionWarning.set('Tu sesión expirará en 30 minutos');
        // Ocultar warning después de 10 segundos
        setTimeout(() => this._sessionWarning.set(null), 10000);
      }
    }, warningTime);
    
    this.sessionTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this._isAuthenticated()) {
          this.logout();
        }
      });
    }, remaining);
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this._isAuthenticated()) {
          // Mostrar warning antes de cerrar por inactividad
          this._sessionWarning.set('Sesión cerrada por inactividad');
          setTimeout(() => this._sessionWarning.set(null), 5000);
          this.logout();
        }
      });
    }, this.INACTIVITY_LIMIT);
  }

  private registerActivityListeners(): void {
    if (typeof window === 'undefined') return;
    
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Usar arrow function para mantener el contexto
    const activityHandler = () => {
      if (this._isAuthenticated()) {
        this.resetInactivityTimer();
      }
    };
    
    // Agregar listeners de forma pasiva para mejor performance
    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });
  }

  login(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._sessionWarning.set(null);
    
    return new Promise((resolve) => {
      this.api.login(email, password).subscribe({
        next: (response) => {
          if (response.success && response.user) {
            // Normalizar el campo id desde _id de MongoDB
            const userData = {
              ...response.user,
              id: response.user.id || (response.user as any)._id,
              rut: response.user.rut || undefined
            };
            const userString = JSON.stringify(userData);
            
            this._user.set(userData);
            this._isAuthenticated.set(true);
            
            // Guardar en cookie (8 horas) y localStorage
            this.setCookie('user', userString, 8 / 24); // 8 horas
            localStorage.setItem('user', userString);
            
            // Iniciar timers de sesión
            this.startSessionTimers();
            
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
    // Limpiar timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    this._user.set(null);
    this._isAuthenticated.set(false);
    this._sessionWarning.set(null);
    this.deleteCookie('user');
    localStorage.removeItem('user');
    // Reemplazar historial para prevenir volver atrás
    history.replaceState(null, '', '/login');
    this.router.navigate(['/login']);
  }

  // Método para extender la sesión (por ejemplo, al hacer click en "Continuar")
  extendSession(): void {
    if (this._isAuthenticated()) {
      this.startSessionTimers();
      // Guardar cookie actualizada
      const userString = JSON.stringify(this._user());
      this.setCookie('user', userString, 8 / 24);
      localStorage.setItem('user', userString);
      this._sessionWarning.set(null);
    }
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