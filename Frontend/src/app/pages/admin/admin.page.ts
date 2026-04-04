import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario, Estudiante, Curso } from '../../shared/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="header-bar">
      <div class="header-left">
        <span class="material-icons header-icon">admin_panel_settings</span>
        <h1 class="header-title">Administración</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</span>
          @if (auth.user()?.rut) {
            <span class="user-rut">RUT: {{ auth.user()?.rut }}</span>
          }
        </div>
        <button class="btn-logout" (click)="logout()">
          <span class="material-icons">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </div>
    
    <div class="page-container">
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'usuarios'" (click)="activeTab.set('usuarios')">
          <span class="material-icons">people</span>
          Usuarios
        </button>
        <button class="tab" [class.active]="activeTab() === 'estudiantes'" (click)="activeTab.set('estudiantes')">
          <span class="material-icons">school</span>
          Estudiantes
        </button>
        <button class="tab" [class.active]="activeTab() === 'cursos'" (click)="activeTab.set('cursos')">
          <span class="material-icons">class</span>
          Cursos
        </button>
      </div>
      
      <!-- USUARIOS TAB -->
      @if (activeTab() === 'usuarios') {
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon users">
              <span class="material-icons">people</span>
            </div>
            <div class="stat-value">{{ usuarios().length }}</div>
            <div class="stat-label">Usuarios Totales</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon admins">
              <span class="material-icons">shield</span>
            </div>
            <div class="stat-value">{{ getCountByRole('administrador') }}</div>
            <div class="stat-label">Administradores</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon docentes">
              <span class="material-icons">school</span>
            </div>
            <div class="stat-value">{{ getCountByRole('docente') }}</div>
            <div class="stat-label">Docentes</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon apoderados">
              <span class="material-icons">family_restroom</span>
            </div>
            <div class="stat-value">{{ getCountByRole('apoderado') }}</div>
            <div class="stat-label">Apoderados</div>
          </div>
        </div>
        
        <!-- Users Table -->
        <div class="content-card">
          <div class="card-header">
            <div class="card-header-left">
              <h3 class="card-title">
                <span class="material-icons">person</span>
                Gestión de Usuarios
              </h3>
            </div>
            <div class="card-header-right">
              <select class="filter-select" [(ngModel)]="rolFilter" (ngModelChange)="applyFilter()">
                <option value="">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="docente">Docente</option>
                <option value="apoderado">Apoderado</option>
              </select>
              <button class="btn-new" (click)="openUserDialog()">
                <span class="material-icons">add</span>
                Nuevo Usuario
              </button>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (user of usuarios(); track user.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ user.nombre?.charAt(0) }}{{ user.apellido?.charAt(0) }}</div>
                        <div class="user-info">
                          <span class="user-name-table">{{ user.nombre }} {{ user.apellido }}</span>
                          <span class="user-username">&#64;{{ user.username }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span class="badge badge-{{ user.rol }}">{{ user.rol }}</span>
                    </td>
                    <td>
                      <span class="badge" [class.badge-activo]="user.activo" [class.badge-inactivo]="!user.activo">
                        {{ user.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon edit" (click)="openUserDialog(user)" title="Editar">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn-icon delete" (click)="deleteUsuario(user)" title="Eliminar">
                          <span class="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            
            @if (usuarios().length === 0) {
              <div class="empty-state">
                <span class="material-icons">person_off</span>
                <p>No hay usuarios registrados</p>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- ESTUDIANTES TAB -->
      @if (activeTab() === 'estudiantes') {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon students">
              <span class="material-icons">school</span>
            </div>
            <div class="stat-value">{{ estudiantes().length }}</div>
            <div class="stat-label">Total Estudiantes</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon courses">
              <span class="material-icons">class</span>
            </div>
            <div class="stat-value">{{ cursos().length }}</div>
            <div class="stat-label">Cursos</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon guardian">
              <span class="material-icons">family_restroom</span>
            </div>
            <div class="stat-value">{{ getEstudiantesConApoderado() }}</div>
            <div class="stat-label">Con Apoderado</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon no-guardian">
              <span class="material-icons">person_off</span>
            </div>
            <div class="stat-value">{{ estudiantes().length - getEstudiantesConApoderado() }}</div>
            <div class="stat-label">Sin Apoderado</div>
          </div>
        </div>
        
        <div class="content-card">
          <div class="card-header">
            <div class="card-header-left">
              <h3 class="card-title">
                <span class="material-icons">school</span>
                Gestión de Estudiantes
              </h3>
            </div>
            <div class="card-header-right">
              <button class="btn-new" (click)="openStudentDialog()">
                <span class="material-icons">add</span>
                Nuevo Estudiante
              </button>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>RUT</th>
                  <th>Curso</th>
                  <th>Apoderado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (est of estudiantes(); track est.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar student">{{ est.nombre?.charAt(0) }}{{ est.apellido?.charAt(0) }}</div>
                        <div class="user-info">
                          <span class="user-name-table">{{ est.nombre }} {{ est.apellido }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ est.rut }}</td>
                    <td>
                      <span class="badge badge-curso">{{ getCursoNombre(est.curso_id) }}</span>
                    </td>
                    <td>
                      @if (est.apoderado_id) {
                        <span class="badge badge-activo">Asignado</span>
                      } @else {
                        <span class="badge badge-inactivo">Sin asignar</span>
                      }
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon edit" (click)="openStudentDialog(est)" title="Editar">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn-icon delete" (click)="deleteEstudiante(est)" title="Eliminar">
                          <span class="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            
            @if (estudiantes().length === 0) {
              <div class="empty-state">
                <span class="material-icons">school</span>
                <p>No hay estudiantes registrados</p>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- CURSOS TAB -->
      @if (activeTab() === 'cursos') {
        <div class="content-card">
          <div class="card-header">
            <div class="card-header-left">
              <h3 class="card-title">
                <span class="material-icons">class</span>
                Gestión de Cursos
              </h3>
            </div>
            <div class="card-header-right">
              <button class="btn-new" (click)="openCursoDialog()">
                <span class="material-icons">add</span>
                Nuevo Curso
              </button>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Nivel</th>
                  <th>Año</th>
                  <th>Estudiantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (curso of cursos(); track curso.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar course">{{ curso.nombre?.charAt(0) }}</div>
                        <span class="user-name-table">{{ curso.nombre }}</span>
                      </div>
                    </td>
                    <td>{{ curso.nivel }}</td>
                    <td>{{ curso.ano }}</td>
                    <td>{{ getEstudiantesCount(curso.id) }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon edit" (click)="openCursoDialog(curso)" title="Editar">
                          <span class="material-icons">edit</span>
                        </button>
                        <button class="btn-icon delete" (click)="deleteCurso(curso)" title="Eliminar">
                          <span class="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            
            @if (cursos().length === 0) {
              <div class="empty-state">
                <span class="material-icons">class</span>
                <p>No hay cursos registrados</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
    
    <!-- User Dialog -->
    @if (showUserDialog()) {
      <div class="dialog-overlay" (click)="closeUserDialog()">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2 class="dialog-title">
              {{ editingUser() ? 'Editar' : 'Crear' }} Usuario
            </h2>
            <button class="btn-icon" (click)="closeUserDialog()">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <form (ngSubmit)="saveUser()" class="dialog-form">
            <div class="form-group">
              <label class="form-label">RUT</label>
              <input type="text" class="form-input" [(ngModel)]="userForm.rut" name="rut" placeholder="12345678-9">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" [(ngModel)]="userForm.nombre" name="nombre" required>
              </div>
              <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" class="form-input" [(ngModel)]="userForm.apellido" name="apellido" required>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input type="email" class="form-input" [(ngModel)]="userForm.email" name="email" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Usuario</label>
                <input type="text" class="form-input" [(ngModel)]="userForm.username" name="username" required>
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-input" [(ngModel)]="userForm.telefono" name="telefono">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ editingUser() ? 'Nueva Contraseña (opcional)' : 'Contraseña' }}</label>
              <input type="password" class="form-input" [(ngModel)]="userForm.password" name="password" [required]="!editingUser()">
            </div>
            
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select class="form-input" [(ngModel)]="userForm.rol" name="rol" required>
                <option value="administrador">Administrador</option>
                <option value="docente">Docente</option>
                <option value="apoderado">Apoderado</option>
              </select>
            </div>
            
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="closeUserDialog()">Cancelar</button>
              <button type="submit" class="btn-save">
                {{ editingUser() ? 'Actualizar' : 'Crear' }} Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    
    <!-- Student Dialog -->
    @if (showStudentDialog()) {
      <div class="dialog-overlay" (click)="closeStudentDialog()">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2 class="dialog-title">
              {{ editingStudent() ? 'Editar' : 'Crear' }} Estudiante
            </h2>
            <button class="btn-icon" (click)="closeStudentDialog()">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <form (ngSubmit)="saveStudent()" class="dialog-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-input" [(ngModel)]="studentForm.nombre" name="nombre" required>
              </div>
              <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" class="form-input" [(ngModel)]="studentForm.apellido" name="apellido" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">RUT</label>
                <input type="text" class="form-input" [(ngModel)]="studentForm.rut" name="rut" placeholder="12345678-9" required>
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-input" [(ngModel)]="studentForm.telefono" name="telefono">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Curso</label>
              <select class="form-input" [(ngModel)]="studentForm.curso_id" name="curso_id">
                <option value="">Sin curso asignado</option>
                @for (curso of cursos(); track curso.id) {
                  <option [value]="curso.id">{{ curso.nombre }} - {{ curso.nivel }}</option>
                }
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Apoderado (Usuario)</label>
              <select class="form-input" [(ngModel)]="studentForm.apoderado_id" name="apoderado_id">
                <option value="">Sin apoderado asignado</option>
                @for (user of usuarios(); track user.id) {
                  @if (user.rol === 'apoderado') {
                    <option [value]="user.id">{{ user.nombre }} {{ user.apellido }} ({{ user.email }})</option>
                  }
                }
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input type="text" class="form-input" [(ngModel)]="studentForm.direccion" name="direccion">
            </div>
            
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="closeStudentDialog()">Cancelar</button>
              <button type="submit" class="btn-save">
                {{ editingStudent() ? 'Actualizar' : 'Crear' }} Estudiante
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    
    <!-- Curso Dialog -->
    @if (showCursoDialog()) {
      <div class="dialog-overlay" (click)="closeCursoDialog()">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2 class="dialog-title">
              {{ editingCurso() ? 'Editar' : 'Crear' }} Curso
            </h2>
            <button class="btn-icon" (click)="closeCursoDialog()">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <form (ngSubmit)="saveCurso()" class="dialog-form">
            <div class="form-group">
              <label class="form-label">Nombre del Curso</label>
              <input type="text" class="form-input" [(ngModel)]="cursoForm.nombre" name="nombre" placeholder="Ej: 1° Medio A" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nivel</label>
                <select class="form-input" [(ngModel)]="cursoForm.nivel" name="nivel" required>
                  <option value="Prekinder">Prekinder</option>
                  <option value="Kinder">Kinder</option>
                  <option value="1° Básico">1° Básico</option>
                  <option value="2° Básico">2° Básico</option>
                  <option value="3° Básico">3° Básico</option>
                  <option value="4° Básico">4° Básico</option>
                  <option value="5° Básico">5° Básico</option>
                  <option value="6° Básico">6° Básico</option>
                  <option value="7° Básico">7° Básico</option>
                  <option value="8° Básico">8° Básico</option>
                  <option value="1° Medio">1° Medio</option>
                  <option value="2° Medio">2° Medio</option>
                  <option value="3° Medio">3° Medio</option>
                  <option value="4° Medio">4° Medio</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Año</label>
                <input type="number" class="form-input" [(ngModel)]="cursoForm.ano" name="ano" required>
              </div>
            </div>
            
            <div class="dialog-actions">
              <button type="button" class="btn-cancel" (click)="closeCursoDialog()">Cancelar</button>
              <button type="submit" class="btn-save">
                {{ editingCurso() ? 'Actualizar' : 'Crear' }} Curso
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header-icon {
      color: #1e293b;
      font-size: 32px;
    }
    
    .header-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .user-name {
      color: #1e293b;
      font-weight: 600;
    }
    
    .user-rut {
      color: #64748b;
      font-size: 0.8rem;
    }
    
    .page-container {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
    }
    
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    
    .stat-icon .material-icons {
      color: white;
      font-size: 24px;
    }
    
    .stat-icon.users { background: #1e293b; }
    .stat-icon.admins { background: #475569; }
    .stat-icon.docentes { background: #3b82f6; }
    .stat-icon.apoderados { background: #06b6d4; }
    
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .stat-label {
      color: #64748b;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    
    .content-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .card-title .material-icons {
      color: #1e293b;
    }
    
    .card-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .filter-select {
      padding: 10px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
    }
    
    .table-wrapper {
      overflow-x: auto;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .data-table td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .data-table tr:hover {
      background: #f8fafc;
    }
    
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #1e293b;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
    }
    
    .user-name-table {
      font-weight: 500;
      color: #1e293b;
    }
    
    .user-username {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .badge-administrador { background: #e2e8f0; color: #1e293b; }
    .badge-docente { background: #e2e8f0; color: #1e293b; }
    .badge-apoderado { background: #e2e8f0; color: #1e293b; }
    .badge-activo { background: #dcfce7; color: #15803d; }
    .badge-inactivo { background: #fee2e2; color: #dc2626; }
    
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    
    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .btn-icon:hover {
      background: #f1f5f9;
    }
    
    .btn-icon.edit { color: #1e293b; }
    .btn-icon.delete { color: #ef4444; }
    .btn-icon .material-icons { font-size: 20px; }
    
    .empty-state {
      padding: 60px;
      text-align: center;
      color: #94a3b8;
    }
    
    .empty-state .material-icons {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .dialog-content {
      background: white;
      border-radius: 20px;
      padding: 32px;
      max-width: 560px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .dialog-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
    }
    
    .form-label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 6px;
    }
    
    .form-input {
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: #1e293b;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }
    
    /* Tab styles */
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      background: white;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tab:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    
    .tab.active {
      background: #1e293b;
      color: white;
    }
    
    .tab .material-icons {
      font-size: 20px;
    }
    
    /* New button styles - Modern slate */
    .btn-new {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-new:hover {
      background: #334155;
      transform: translateY(-1px);
    }
    
    .btn-new .material-icons {
      font-size: 18px;
    }
    
    /* Logout button - Modern slate */
    .btn-logout {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: white;
      color: #1e293b;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-logout:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .btn-logout .material-icons {
      font-size: 18px;
    }
    
    /* Cancel and Save buttons */
    .btn-cancel {
      padding: 12px 24px;
      background: #f1f5f9;
      color: #475569;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-cancel:hover {
      background: #e2e8f0;
    }
    
    .btn-save {
      padding: 12px 24px;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-save:hover {
      background: #334155;
    }
    
    /* Stat icons */
    .stat-icon.users { background: #1e293b; }
    .stat-icon.admins { background: #475569; }
    .stat-icon.docentes { background: #3b82f6; }
    .stat-icon.apoderados { background: #06b6d4; }
    .stat-icon.students { background: #1e293b; }
    .stat-icon.courses { background: #06b6d4; }
    .stat-icon.guardian { background: #f59e0b; }
    .stat-icon.no-guardian { background: #ef4444; }
    
    /* Tab styles */
    .tab.active {
      background: #1e293b;
      color: white;
    }
    
    .tab:hover {
      background: #f1f5f9;
    }
    
    .tab.active:hover {
      background: #334155;
    }

    @media (max-width: 768px) {
      .header-bar {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .card-header {
        flex-direction: column;
        gap: 16px;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // Data signals
  usuarios = signal<Usuario[]>([]);
  estudiantes = signal<Estudiante[]>([]);
  cursos = signal<Curso[]>([]);
  
  // Tab state
  activeTab = signal<'usuarios' | 'estudiantes' | 'cursos'>('usuarios');
  
  // Dialog states
  showUserDialog = signal(false);
  showStudentDialog = signal(false);
  showCursoDialog = signal(false);
  
  // Editing states
  editingUser = signal<Usuario | null>(null);
  editingStudent = signal<Estudiante | null>(null);
  editingCurso = signal<Curso | null>(null);
  
  // Filters
  rolFilter = '';
  
  // Form data
  userForm: Partial<Usuario> = {
    rut: '',
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    password: '',
    telefono: '',
    rol: 'docente',
    activo: true
  };
  
  studentForm: Partial<Estudiante> = {
    rut: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    curso_id: '',
    apoderado_id: ''
  };
  
  cursoForm: Partial<Curso> = {
    nombre: '',
    nivel: '',
    ano: new Date().getFullYear()
  };

  ngOnInit(): void {
    this.loadAll();
  }
  
  loadAll(): void {
    this.loadUsuarios();
    this.loadEstudiantes();
    this.loadCursos();
  }
  
  loadUsuarios(): void {
    this.api.getUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => this.showMessage('Error al cargar usuarios')
    });
  }
  
  loadEstudiantes(): void {
    this.api.getEstudiantes().subscribe({
      next: (data) => this.estudiantes.set(data),
      error: () => this.showMessage('Error al cargar estudiantes')
    });
  }
  
  loadCursos(): void {
    this.api.getCursos().subscribe({
      next: (data) => this.cursos.set(data),
      error: () => this.showMessage('Error al cargar cursos')
    });
  }

  getCountByRole(rol: string): number {
    return this.usuarios().filter(u => u.rol === rol).length;
  }
  
  getEstudiantesConApoderado(): number {
    return this.estudiantes().filter(e => e.apoderado_id).length;
  }
  
  getEstudiantesCount(cursoId: string | undefined): number {
    if (!cursoId) return 0;
    return this.estudiantes().filter(e => e.curso_id === cursoId).length;
  }
  
  getCursoNombre(cursoId: string | undefined): string {
    if (!cursoId) return 'Sin curso';
    const curso = this.cursos().find(c => c.id === cursoId);
    return curso ? curso.nivel + ' ' + curso.nombre : 'Sin curso';
  }

  applyFilter(): void {
    if (this.rolFilter) {
      this.api.getUsuarios().subscribe({
        next: (data) => this.usuarios.set(data.filter(u => u.rol === this.rolFilter)),
        error: () => this.showMessage('Error al filtrar')
      });
    } else {
      this.loadUsuarios();
    }
  }
  
  // ============ USER METHODS ============
  openUserDialog(user?: Usuario): void {
    if (user) {
      this.editingUser.set(user);
      this.userForm = { ...user };
    } else {
      this.editingUser.set(null);
      this.userForm = {
        rut: '',
        nombre: '',
        apellido: '',
        email: '',
        username: '',
        password: '',
        telefono: '',
        rol: 'docente',
        activo: true
      };
    }
    this.showUserDialog.set(true);
  }
  
  closeUserDialog(): void {
    this.showUserDialog.set(false);
    this.editingUser.set(null);
  }
  
  saveUser(): void {
    const user = this.editingUser();
    
    if (user?.id) {
      this.api.updateUsuario(user.id, this.userForm).subscribe({
        next: () => {
          this.showMessage('Usuario actualizado correctamente');
          this.loadUsuarios();
          this.closeUserDialog();
        },
        error: () => this.showMessage('Error al actualizar usuario')
      });
    } else {
      this.api.createUsuario(this.userForm).subscribe({
        next: () => {
          this.showMessage('Usuario creado correctamente');
          this.loadUsuarios();
          this.closeUserDialog();
        },
        error: () => this.showMessage('Error al crear usuario')
      });
    }
  }
  
  deleteUsuario(user: Usuario): void {
    if (confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) {
      if (user.id) {
        this.api.deleteUsuario(user.id).subscribe({
          next: () => {
            this.showMessage('Usuario eliminado correctamente');
            this.loadUsuarios();
          },
          error: () => this.showMessage('Error al eliminar usuario')
        });
      }
    }
  }
  
  // ============ STUDENT METHODS ============
  openStudentDialog(student?: Estudiante): void {
    if (student) {
      this.editingStudent.set(student);
      this.studentForm = { ...student };
    } else {
      this.editingStudent.set(null);
      this.studentForm = {
        rut: '',
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        direccion: '',
        telefono: '',
        curso_id: '',
        apoderado_id: ''
      };
    }
    this.showStudentDialog.set(true);
  }
  
  closeStudentDialog(): void {
    this.showStudentDialog.set(false);
    this.editingStudent.set(null);
  }
  
  saveStudent(): void {
    const student = this.editingStudent();
    
    if (student?.id) {
      this.api.updateEstudiante(student.id, this.studentForm).subscribe({
        next: () => {
          this.showMessage('Estudiante actualizado correctamente');
          this.loadEstudiantes();
          this.closeStudentDialog();
        },
        error: () => this.showMessage('Error al actualizar estudiante')
      });
    } else {
      this.api.createEstudiante(this.studentForm).subscribe({
        next: () => {
          this.showMessage('Estudiante creado correctamente');
          this.loadEstudiantes();
          this.closeStudentDialog();
        },
        error: () => this.showMessage('Error al crear estudiante')
      });
    }
  }
  
  deleteEstudiante(student: Estudiante): void {
    if (confirm(`¿Estás seguro de eliminar a ${student.nombre}?`)) {
      if (student.id) {
        this.api.deleteEstudiante(student.id).subscribe({
          next: () => {
            this.showMessage('Estudiante eliminado correctamente');
            this.loadEstudiantes();
          },
          error: () => this.showMessage('Error al eliminar estudiante')
        });
      }
    }
  }
  
  // ============ CURSO METHODS ============
  openCursoDialog(curso?: Curso): void {
    if (curso) {
      this.editingCurso.set(curso);
      this.cursoForm = { ...curso };
    } else {
      this.editingCurso.set(null);
      this.cursoForm = {
        nombre: '',
        nivel: '',
        ano: new Date().getFullYear()
      };
    }
    this.showCursoDialog.set(true);
  }
  
  closeCursoDialog(): void {
    this.showCursoDialog.set(false);
    this.editingCurso.set(null);
  }
  
  saveCurso(): void {
    const curso = this.editingCurso();
    const dataToSend = {
      nombre: this.cursoForm.nombre,
      nivel: this.cursoForm.nivel,
      ano: this.cursoForm.ano || new Date().getFullYear()
    };
    
    if (curso?.id) {
      this.api.updateCurso(curso.id, dataToSend).subscribe({
        next: () => {
          this.showMessage('Curso actualizado correctamente');
          this.loadCursos();
          this.closeCursoDialog();
        },
        error: () => this.showMessage('Error al actualizar curso')
      });
    } else {
      this.api.createCurso(dataToSend).subscribe({
        next: () => {
          this.showMessage('Curso creado correctamente');
          this.loadCursos();
          this.closeCursoDialog();
        },
        error: () => this.showMessage('Error al crear curso')
      });
    }
  }
  
  deleteCurso(curso: Curso): void {
    if (confirm(`¿Estás seguro de eliminar el curso ${curso.nombre}?`)) {
      if (curso.id) {
        this.api.deleteCurso(curso.id).subscribe({
          next: () => {
            this.showMessage('Curso eliminado correctamente');
            this.loadCursos();
          },
          error: () => this.showMessage('Error al eliminar curso')
        });
      }
    }
  }

  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  logout(): void {
    this.auth.logout();
  }
}
