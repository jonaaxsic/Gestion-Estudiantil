import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { Estudiante } from '../../shared/models';

interface RegistroData {
  email: string;
  password: string;
  confirmPassword: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  estudiante_id: string;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.css']
})
export class RegistroPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // Datos del formulario
  email = '';
  password = '';
  confirmPassword = '';
  rut = '';
  nombre = '';
  apellido = '';
  telefono = '';
  direccion = '';
  estudiante_id = '';

  // Estado
  isLoading = signal(false);
  error = signal('');
  success = signal('');
  estudiantes = signal<Estudiante[]>([]);

  constructor() {
    this.cargarEstudiantesSinApoderado();
  }

  private cargarEstudiantesSinApoderado(): void {
    this.api.getEstudiantesSinApoderado().subscribe({
      next: (data) => this.estudiantes.set(data),
      error: () => this.estudiantes.set([])
    });
  }

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.success.set('');

    // Validaciones
    if (!this.email || !this.password || !this.rut || !this.nombre || !this.apellido) {
      this.error.set('Todos los campos obligatorios deben ser completados');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // HU-021: Validar formato RUT chileno
    if (!/^\d{7,8}-[\dkK]$/.test(this.rut)) {
      this.error.set('El RUT no tiene un formato válido (ej: 12345678-9)');
      return;
    }

    // HU-022: Validar formato de correo electrónico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.error.set('El correo electrónico no tiene un formato válido');
      return;
    }

    this.isLoading.set(true);

    this.api.registroApoderado({
      email: this.email,
      password: this.password,
      rut: this.rut,
      nombre: this.nombre,
      apellido: this.apellido,
      telefono: this.telefono,
      direccion: this.direccion,
      estudiante_id: this.estudiante_id
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.success.set('Registro exitoso. Ahora puedes iniciar sesión.');
        // Limpiar el formulario
        this.limpiarFormulario();
        // Redireccionar al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        const mensaje = err.error?.error || 'Error al registrar. Intenta nuevamente.';
        this.error.set(mensaje);
      }
    });
  }

  private limpiarFormulario(): void {
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.rut = '';
    this.nombre = '';
    this.apellido = '';
    this.telefono = '';
    this.direccion = '';
    this.estudiante_id = '';
  }
}