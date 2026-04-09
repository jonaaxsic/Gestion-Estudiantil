import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css']
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