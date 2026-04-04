import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Curso, Evaluacion, Anotacion, Estudiante, Asistencia, Reunione } from '../../shared/models';

@Component({
  selector: 'app-dashboard-docente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="header-bar">
      <div class="header-left">
        <span class="material-icons header-icon">school</span>
        <h1 class="header-title">Panel del Docente</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</span>
          @if (auth.user()?.rut) {
            <span class="user-rut">RUT: {{ auth.user()?.rut }}</span>
          }
        </div>
        <button class="btn btn-secondary" (click)="logout()">
          <span class="material-icons">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </div>
    
    <div class="page-container">
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon cursos">
            <span class="material-icons">class</span>
          </div>
          <div class="stat-value">{{ cursos().length }}</div>
          <div class="stat-label">Cursos</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon estudiantes">
            <span class="material-icons">groups</span>
          </div>
          <div class="stat-value">{{ estudiantes().length }}</div>
          <div class="stat-label">Estudiantes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon evaluaciones">
            <span class="material-icons">assignment</span>
          </div>
          <div class="stat-value">{{ evaluaciones().length }}</div>
          <div class="stat-label">Evaluaciones</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon anotaciones">
            <span class="material-icons">note</span>
          </div>
          <div class="stat-value">{{ anotaciones().length }}</div>
          <div class="stat-label">Anotaciones</div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <h2 class="section-title">
        <span class="material-icons">flash_on</span>
        Acciones Rápidas
      </h2>
      
      <div class="quick-actions-grid">
        <button class="quick-action-btn" (click)="openAsistenciaDialog()">
          <span class="material-icons">how_to_reg</span>
          <span>Registrar Asistencia</span>
        </button>
        <button class="quick-action-btn" (click)="openEvaluacionDialog()">
          <span class="material-icons">add_circle</span>
          <span>Crear Evaluación</span>
        </button>
        <button class="quick-action-btn" (click)="openAnotacionDialog()">
          <span class="material-icons">edit_note</span>
          <span>Nueva Anotación</span>
        </button>
        <button class="quick-action-btn" (click)="openReunionDialog()">
          <span class="material-icons">event_available</span>
          <span>Programar Reunión</span>
        </button>
      </div>
      
      <!-- Content Grid -->
      <div class="card-grid">
        <!-- Evaluaciones -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <span class="material-icons">assignment</span>
              Evaluaciones Próximas
            </h3>
          </div>
          <div class="card-body">
            @if (evaluaciones().length === 0) {
              <div class="empty-state">
                <span class="material-icons">info</span>
                <p>No hay evaluaciones registradas</p>
              </div>
            } @else {
              @for (eval of evaluaciones(); track eval.id) {
                <div class="list-item">
                  <div class="list-icon eval">
                    <span class="material-icons">description</span>
                  </div>
                  <div class="list-content">
                    <span class="title">{{ eval.titulo }}</span>
                    <span class="subtitle">{{ eval.materia }} • {{ eval.fecha }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
        
        <!-- Anotaciones -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <span class="material-icons">note</span>
              Anotaciones Recientes
            </h3>
          </div>
          <div class="card-body">
            @if (anotaciones().length === 0) {
              <div class="empty-state">
                <span class="material-icons">info</span>
                <p>No hay anotaciones</p>
              </div>
            } @else {
              @for (anot of anotaciones(); track anot.id) {
                <div class="list-item">
                  <div class="list-icon" [class.positiva]="anot.tipo === 'positiva'" [class.negativa]="anot.tipo === 'negativa'">
                    <span class="material-icons">{{ anot.tipo === 'positiva' ? 'thumb_up' : 'thumb_down' }}</span>
                  </div>
                  <div class="list-content">
                    <span class="title">{{ anot.descripcion }}</span>
                    <span class="subtitle">{{ anot.fecha }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
    
    <!-- Asistencia Modal -->
    @if (showAsistenciaModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="material-icons">how_to_reg</span> Registrar Asistencia</h2>
            <button class="close-btn" (click)="closeModals()">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Curso</label>
              <select class="form-select" [(ngModel)]="asistenciaForm.cursoId" (change)="loadEstudiantesPorCurso()">
                <option value="">Seleccionar curso</option>
                @for (curso of cursos(); track curso.id) {
                  <option [value]="curso.id">{{ curso.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-input" [(ngModel)]="asistenciaForm.fecha">
            </div>
            @if (estudiantes().length > 0) {
              <div class="students-list">
                <label class="form-label">Estudiantes</label>
                @for (est of estudiantes(); track est.id) {
                  <div class="student-row">
                    <span class="student-name">{{ est.nombre }} {{ est.apellido }}</span>
                    <div class="attendance-buttons">
                      <button 
                        type="button"
                        class="att-btn presente" 
                        [class.active]="asistenciaForm.registros[est.id!] === true"
                        (click)="setAttendance(est.id!, true)"
                      >
                        <span class="material-icons">check</span> Presente
                      </button>
                      <button 
                        type="button"
                        class="att-btn falta" 
                        [class.active]="asistenciaForm.registros[est.id!] === false"
                        (click)="setAttendance(est.id!, false)"
                      >
                        <span class="material-icons">close</span> Ausente
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveAsistencia()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar Asistencia' }}
            </button>
          </div>
        </div>
      </div>
    }
    
    <!-- Evaluacion Modal -->
    @if (showEvaluacionModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="material-icons">add_circle</span> Crear Evaluación</h2>
            <button class="close-btn" (click)="closeModals()">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Curso</label>
              <select class="form-select" [(ngModel)]="evaluacionForm.cursoId">
                <option value="">Seleccionar curso</option>
                @for (curso of cursos(); track curso.id) {
                  <option [value]="curso.id">{{ curso.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Materia</label>
              <input type="text" class="form-input" [(ngModel)]="evaluacionForm.materia" placeholder="Ej: Matemáticas">
            </div>
            <div class="form-group">
              <label class="form-label">Título</label>
              <input type="text" class="form-input" [(ngModel)]="evaluacionForm.titulo" placeholder="Ej: Prueba 1">
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea class="form-textarea" [(ngModel)]="evaluacionForm.descripcion" placeholder="Contenido de la evaluación"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-input" [(ngModel)]="evaluacionForm.fecha">
            </div>
            <div class="form-group">
              <label class="form-label">Ponderación (%)</label>
              <input type="number" class="form-input" [(ngModel)]="evaluacionForm.ponderacion" placeholder="20">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveEvaluacion()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Crear Evaluación' }}
            </button>
          </div>
        </div>
      </div>
    }
    
    <!-- Anotacion Modal -->
    @if (showAnotacionModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="material-icons">edit_note</span> Nueva Anotación</h2>
            <button class="close-btn" (click)="closeModals()">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Estudiante</label>
              <select class="form-select" [(ngModel)]="anotacionForm.estudianteId">
                <option value="">Seleccionar estudiante</option>
                @for (est of estudiantes(); track est.id) {
                  <option [value]="est.id">{{ est.nombre }} {{ est.apellido }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Anotación</label>
              <div class="tipo-buttons">
                <button 
                  type="button"
                  class="tipo-btn positiva" 
                  [class.active]="anotacionForm.tipo === 'positiva'"
                  (click)="anotacionForm.tipo = 'positiva'"
                >
                  <span class="material-icons">thumb_up</span> Positiva
                </button>
                <button 
                  type="button"
                  class="tipo-btn negativa" 
                  [class.active]="anotacionForm.tipo === 'negativa'"
                  (click)="anotacionForm.tipo = 'negativa'"
                >
                  <span class="material-icons">thumb_down</span> Negativa
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea class="form-textarea" [(ngModel)]="anotacionForm.descripcion" placeholder="Describe la anotación..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-input" [(ngModel)]="anotacionForm.fecha">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveAnotacion()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Crear Anotación' }}
            </button>
          </div>
        </div>
      </div>
    }
    
    <!-- Reunion Modal -->
    @if (showReunionModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="material-icons">event_available</span> Programar Reunión</h2>
            <button class="close-btn" (click)="closeModals()">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Curso</label>
              <select class="form-select" [(ngModel)]="reunionForm.cursoId">
                <option value="">Seleccionar curso</option>
                @for (curso of cursos(); track curso.id) {
                  <option [value]="curso.id">{{ curso.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-input" [(ngModel)]="reunionForm.fecha">
            </div>
            <div class="form-group">
              <label class="form-label">Hora</label>
              <input type="time" class="form-input" [(ngModel)]="reunionForm.hora">
            </div>
            <div class="form-group">
              <label class="form-label">Lugar</label>
              <input type="text" class="form-input" [(ngModel)]="reunionForm.lugar" placeholder="Ej: Sala de profesores">
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea class="form-textarea" [(ngModel)]="reunionForm.descripcion" placeholder="Motivo de la reunión"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveReunion()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Programar Reunión' }}
            </button>
          </div>
        </div>
      </div>
    }
    
    <!-- Success Message -->
    @if (successMessage()) {
      <div class="toast success">
        <span class="material-icons">check_circle</span>
        {{ successMessage() }}
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
    
    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    
    .btn-primary {
      background: #1e293b;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #334155;
    }
    
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    
    .stat-icon.cursos { background: #1e293b; }
    .stat-icon.estudiantes { background: #475569; }
    .stat-icon.evaluaciones { background: #1e293b; }
    .stat-icon.anotaciones { background: #475569; }
    
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
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }
    
    .section-title .material-icons {
      color: #f59e0b;
    }
    
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
      font-weight: 500;
      color: #1e293b;
    }
    
    .quick-action-btn:hover {
      border-color: #1e293b;
      background: #f8fafc;
    }
    
    .quick-action-btn .material-icons {
      color: #1e293b;
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    
    .content-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    
    .card-header {
      padding: 20px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .card-title .material-icons {
      color: #667eea;
    }
    
    .card-body {
      padding: 8px 0;
    }
    
    .list-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }
    
    .list-item:hover {
      background: #f8fafc;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .list-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .list-icon .material-icons {
      font-size: 20px;
      color: white;
    }
    
    .list-icon.eval { background: #f59e0b; }
    .list-icon.positiva { background: #22c55e; }
    .list-icon.negativa { background: #ef4444; }
    
    .list-content {
      flex: 1;
      min-width: 0;
    }
    
    .list-content .title {
      display: block;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list-content .subtitle {
      display: block;
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 2px;
    }
    
    .empty-state {
      padding: 40px;
      text-align: center;
      color: #94a3b8;
    }
    
    .empty-state .material-icons {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    
    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    
    .modal-header h2 .material-icons {
      color: #667eea;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #64748b;
    }
    
    .close-btn:hover {
      background: #f1f5f9;
    }
    
    .modal-body {
      padding: 24px;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 6px;
    }
    
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s;
      background: #f9fafb;
      box-sizing: border-box;
    }
    
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #667eea;
      background: white;
    }
    
    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }
    
    .students-list {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    .student-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .student-row:last-child {
      border-bottom: none;
    }
    
    .student-name {
      font-weight: 500;
      color: #1e293b;
    }
    
    .attendance-buttons {
      display: flex;
      gap: 8px;
    }
    
    .att-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .att-btn .material-icons {
      font-size: 16px;
    }
    
    .att-btn.presente {
      color: #22c55e;
    }
    
    .att-btn.presente.active, .att-btn.presente:hover {
      background: #22c55e;
      color: white;
      border-color: #22c55e;
    }
    
    .att-btn.falta {
      color: #ef4444;
    }
    
    .att-btn.falta.active, .att-btn.falta:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }
    
    .tipo-buttons {
      display: flex;
      gap: 12px;
    }
    
    .tipo-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tipo-btn .material-icons {
      font-size: 20px;
    }
    
    .tipo-btn.positiva {
      color: #22c55e;
    }
    
    .tipo-btn.positiva.active, .tipo-btn.positiva:hover {
      background: #22c55e;
      color: white;
      border-color: #22c55e;
    }
    
    .tipo-btn.negativa {
      color: #ef4444;
    }
    
    .tipo-btn.negativa.active, .tipo-btn.negativa:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }
    
    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-radius: 10px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      z-index: 1001;
    }
    
    .toast.success {
      background: #22c55e;
      color: white;
    }
    
    .toast .material-icons {
      font-size: 22px;
    }
    
    @keyframes slideIn {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @media (max-width: 1024px) {
      .stats-grid, .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .card-grid {
        grid-template-columns: 1fr;
      }
    }
    
    @media (max-width: 768px) {
      .header-bar {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      
      .stats-grid, .quick-actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardDocentePage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  
  cursos = signal<Curso[]>([]);
  estudiantes = signal<Estudiante[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  anotaciones = signal<Anotacion[]>([]);
  
  // Modal states
  showAsistenciaModal = signal(false);
  showEvaluacionModal = signal(false);
  showAnotacionModal = signal(false);
  showReunionModal = signal(false);
  saving = signal(false);
  successMessage = signal('');
  
  // Form data
  asistenciaForm = {
    cursoId: '',
    fecha: new Date().toISOString().split('T')[0],
    registros: {} as Record<string, boolean>
  };
  
  evaluacionForm = {
    cursoId: '',
    materia: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    ponderacion: 20
  };
  
  anotacionForm = {
    estudianteId: '',
    tipo: 'negativa' as 'positiva' | 'negativa',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  };
  
  reunionForm = {
    cursoId: '',
    fecha: '',
    hora: '',
    lugar: '',
    descripcion: ''
  };
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.api.getCursos().subscribe(data => this.cursos.set(data));
    this.api.getEstudiantes().subscribe(data => this.estudiantes.set(data));
    this.api.getEvaluaciones().subscribe(data => this.evaluaciones.set(data));
    this.api.getAnotaciones().subscribe(data => this.anotaciones.set(data));
  }
  
  loadEstudiantesPorCurso(): void {
    if (this.asistenciaForm.cursoId) {
      this.api.getEstudiantes(this.asistenciaForm.cursoId).subscribe(data => {
        this.estudiantes.set(data);
        this.asistenciaForm.registros = {};
        data.forEach(est => {
          if (est.id) this.asistenciaForm.registros[est.id] = true;
        });
      });
    }
  }
  
  setAttendance(estudianteId: string, presente: boolean): void {
    this.asistenciaForm.registros[estudianteId] = presente;
  }
  
  // Modal controls
  openAsistenciaDialog(): void {
    this.asistenciaForm = {
      cursoId: '',
      fecha: new Date().toISOString().split('T')[0],
      registros: {}
    };
    this.showAsistenciaModal.set(true);
  }
  
  openEvaluacionDialog(): void {
    this.evaluacionForm = {
      cursoId: '',
      materia: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      ponderacion: 20
    };
    this.showEvaluacionModal.set(true);
  }
  
  openAnotacionDialog(): void {
    this.anotacionForm = {
      estudianteId: '',
      tipo: 'negativa',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0]
    };
    this.showAnotacionModal.set(true);
  }
  
  openReunionDialog(): void {
    this.reunionForm = {
      cursoId: '',
      fecha: '',
      hora: '',
      lugar: '',
      descripcion: ''
    };
    this.showReunionModal.set(true);
  }
  
  closeModals(): void {
    this.showAsistenciaModal.set(false);
    this.showEvaluacionModal.set(false);
    this.showAnotacionModal.set(false);
    this.showReunionModal.set(false);
  }
  
  showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
  
  // Save methods
  saveAsistencia(): void {
    if (!this.asistenciaForm.cursoId || !this.asistenciaForm.fecha) {
      alert('Por favor complete el curso y la fecha');
      return;
    }
    
    const registros = Object.entries(this.asistenciaForm.registros).map(([estudiante_id, presente]) => ({
      estudiante_id,
      presente
    }));
    
    this.saving.set(true);
    this.api.createAsistenciaBulk({
      curso_id: this.asistenciaForm.cursoId,
      fecha: this.asistenciaForm.fecha,
      registros
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Asistencia registrada correctamente');
        this.api.getAsistencia().subscribe(data => {});
      },
      error: () => {
        this.saving.set(false);
        alert('Error al registrar asistencia');
      }
    });
  }
  
  saveEvaluacion(): void {
    if (!this.evaluacionForm.cursoId || !this.evaluacionForm.materia || !this.evaluacionForm.titulo || !this.evaluacionForm.fecha) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.saving.set(true);
    this.api.createEvaluacion({
      curso_id: this.evaluacionForm.cursoId,
      materia: this.evaluacionForm.materia,
      titulo: this.evaluacionForm.titulo,
      descripcion: this.evaluacionForm.descripcion,
      fecha: this.evaluacionForm.fecha,
      ponderacion: this.evaluacionForm.ponderacion
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Evaluación creada correctamente');
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al crear evaluación');
      }
    });
  }
  
  saveAnotacion(): void {
    if (!this.anotacionForm.estudianteId || !this.anotacionForm.descripcion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.saving.set(true);
    this.api.createAnotacion({
      estudiante_id: this.anotacionForm.estudianteId,
      tipo: this.anotacionForm.tipo,
      descripcion: this.anotacionForm.descripcion,
      fecha: this.anotacionForm.fecha
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Anotación creada correctamente');
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al crear anotación');
      }
    });
  }
  
  saveReunion(): void {
    if (!this.reunionForm.cursoId || !this.reunionForm.fecha || !this.reunionForm.hora || !this.reunionForm.lugar) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.saving.set(true);
    this.api.createReunion({
      curso_id: this.reunionForm.cursoId,
      fecha: this.reunionForm.fecha,
      hora: this.reunionForm.hora,
      lugar: this.reunionForm.lugar,
      descripcion: this.reunionForm.descripcion,
      notificacion_enviada: false
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Reunión programada correctamente');
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al programar reunión');
      }
    });
  }
  
  logout(): void {
    this.auth.logout();
  }
}
