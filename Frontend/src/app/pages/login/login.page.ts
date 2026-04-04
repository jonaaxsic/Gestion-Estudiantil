import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">
            <span class="material-icons">school</span>
          </div>
          <h1 class="login-title">Sistema de Gestión</h1>
          <p class="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <div class="input-wrapper">
              <span class="material-icons input-icon">email</span>
              <input 
                type="email" 
                class="form-input" 
                [(ngModel)]="email" 
                name="email" 
                placeholder="correo@colegio.cl"
                required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <div class="input-wrapper">
              <span class="material-icons input-icon">lock</span>
              <input 
                type="password" 
                class="form-input" 
                [(ngModel)]="password" 
                name="password" 
                placeholder="••••••••"
                required
              >
            </div>
          </div>
          
          @if (error()) {
            <div class="error-message">
              <span class="material-icons">error</span>
              {{ error() }}
            </div>
          }
          
          <button type="submit" class="btn btn-primary login-btn" [disabled]="auth.isLoading()">
            @if (auth.isLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <span>Iniciar Sesión</span>
              <span class="material-icons">arrow_forward</span>
            }
          </button>
        </form>
        
        <div class="login-footer">
          <p>¿Necesitas ayuda? Contacta al administrador</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: url('https://res.cloudinary.com/dyslpppz8/image/upload/q_auto/f_auto/v1775268474/fondologin_tje53d.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      padding: 20px;
      position: relative;
    }
    
    .login-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(30, 41, 59, 0.85);
      z-index: 1;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 32px 40px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      position: relative;
      z-index: 2;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }
    
    .login-icon {
      width: 64px;
      height: 64px;
      background: #1e293b;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    
    .login-icon .material-icons {
      color: white;
      font-size: 32px;
    }
    
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 6px;
    }
    
    .login-subtitle {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0;
    }
    
    .login-form {
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      color: #374151;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 18px;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 12px 12px 42px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.2s;
      background: #f9fafb;
      box-sizing: border-box;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #1e293b;
      background: white;
    }
    
    .form-input::placeholder {
      color: #9ca3af;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    
    .error-message .material-icons {
      font-size: 18px;
    }
    
    .login-btn {
      width: 100%;
      height: 48px;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #1e293b;
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .login-btn:hover:not(:disabled) {
      background: #334155;
    }
    
    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .login-footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .login-footer p {
      color: #9ca3af;
      font-size: 0.75rem;
      margin: 0;
    }
  `]
})
export class LoginPage {
  readonly auth = inject(AuthService);
  
  email = '';
  password = '';
  error = signal('');
  
  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Por favor ingresa tu correo y contraseña');
      return;
    }
    
    this.error.set('');
    const success = await this.auth.login(this.email, this.password);
    
    if (success) {
      this.auth.redirectByRole();
    } else {
      this.error.set('Credenciales inválidas. Intenta nuevamente.');
    }
  }
}
