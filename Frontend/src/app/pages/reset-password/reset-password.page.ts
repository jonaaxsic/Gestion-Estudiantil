import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.css']
})
export class ResetPasswordPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly theme = inject(ThemeService);

  // Estado
  email = '';
  step = signal<'code' | 'password'>('code');
  
  // Paso 1: Verificar código
  code = '';
  codeLoading = signal(false);
  
  // Paso 2: Nueva contraseña
  newPassword = '';
  confirmPassword = '';
  showPassword = signal(false);
  showConfirm = signal(false);
  passwordLoading = signal(false);
  
  // Compartido
  error = signal('');
  success = signal('');
  resetToken = '';

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      // Si no hay email en query params, redirigir a forgot-password
      this.router.navigate(['/forgot-password']);
    }
  }

  // ── Paso 1: Verificar código ──────────────────────────

  onVerifyCode(): void {
    this.error.set('');
    
    if (!this.code.trim() || this.code.trim().length !== 6) {
      this.error.set('El código debe tener 6 dígitos');
      return;
    }

    this.codeLoading.set(true);

    this.http.post<{ success: boolean; reset_token?: string; error?: string }>(
      `${environment.apiUrl}/auth/verify-reset-code`,
      { email: this.email, code: this.code.trim() }
    ).subscribe({
      next: (res) => {
        this.codeLoading.set(false);
        if (res.success && res.reset_token) {
          this.resetToken = res.reset_token;
          this.step.set('password');
          this.error.set('');
        } else {
          this.error.set(res.error || 'Código inválido');
        }
      },
      error: (err) => {
        this.codeLoading.set(false);
        this.error.set(err.error?.error || 'Error al verificar el código');
      }
    });
  }

  // ── Paso 2: Establecer nueva contraseña ───────────────

  onResetPassword(): void {
    this.error.set('');

    if (!this.newPassword) {
      this.error.set('Ingresa la nueva contraseña');
      return;
    }

    if (this.newPassword.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.passwordLoading.set(true);

    this.http.post<{ success: boolean; message?: string; error?: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { reset_token: this.resetToken, new_password: this.newPassword }
    ).subscribe({
      next: (res) => {
        this.passwordLoading.set(false);
        if (res.success) {
          this.success.set('Contraseña actualizada correctamente');
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error.set(res.error || 'Error al actualizar la contraseña');
        }
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.error.set(err.error?.error || 'Error al conectar con el servidor');
      }
    });
  }

  // ── Utilidades ────────────────────────────────────────

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Solo permitir números, máximo 6 dígitos
    this.code = input.value.replace(/\D/g, '').slice(0, 6);
  }

  getPasswordStrength(): { label: string; class: string; width: string } {
    const p = this.newPassword;
    if (!p) return { label: '', class: '', width: '0%' };
    
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 2) return { label: 'Débil', class: 'weak', width: '33%' };
    if (score <= 3) return { label: 'Media', class: 'medium', width: '66%' };
    return { label: 'Fuerte', class: 'strong', width: '100%' };
  }
}
