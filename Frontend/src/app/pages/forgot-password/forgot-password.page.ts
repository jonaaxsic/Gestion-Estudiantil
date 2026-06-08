import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.css']
})
export class ForgotPasswordPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  email = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.email.trim()) {
      this.error.set('Ingresa tu correo electrónico');
      return;
    }

    // Validación básica de formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.error.set('Ingresa un correo electrónico válido');
      return;
    }

    this.loading.set(true);

    this.http.post<{ success: boolean; message: string; error?: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email: this.email.trim().toLowerCase() }
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          // Navegar a la página de verificación de código
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email.trim().toLowerCase() }
          });
        } else {
          this.error.set(res.error || 'Error al enviar el código');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.error || 'Error al conectar con el servidor';
        this.error.set(msg);
      }
    });
  }
}
