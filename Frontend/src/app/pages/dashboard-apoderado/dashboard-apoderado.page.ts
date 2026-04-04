import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Estudiante, Asistencia, Evaluacion, Anotacion, Curso } from '../../shared/models';

@Component({
  selector: 'app-dashboard-apoderado',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="header-bar">
      <div class="header-left">
        <span class="material-icons header-icon">family_restroom</span>
        <h1 class="header-title">Panel del Apoderado</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</span>
          <span class="user-rut">RUT: {{ auth.user()?.rut || 'Sin RUT' }}</span>
        </div>
        <button class="btn btn-secondary" (click)="logout()">
          <span class="material-icons">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </div>
    
    <div class="page-container">
      <div class="cards-row">
        <!-- Apoderado Info Card - Blue -->
        <div class="info-card azul">
          <div class="card-header">
            <span class="material-icons">person</span>
            <h2>Datos del Apoderado</h2>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">{{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</span>
            </div>
            <div class="info-row">
              <span class="label">RUT:</span>
              <span class="value">{{ auth.user()?.rut || 'Sin RUT' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">{{ auth.user()?.email }}</span>
            </div>
          </div>
        </div>
        
        <!-- Pupilo Info Card - Green -->
        @if (estudiante()) {
          <div class="info-card verde">
            <div class="card-header">
              <span class="material-icons">school</span>
              <h2>Información del Pupilo</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">{{ estudiante()?.nombre }} {{ estudiante()?.apellido }}</span>
              </div>
              <div class="info-row">
                <span class="label">RUT:</span>
                <span class="value">{{ estudiante()?.rut }}</span>
              </div>
              <div class="info-row">
                <span class="label">Curso:</span>
                <span class="value">{{ getCursoNombre(estudiante()?.curso_id) }}</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="info-card verde empty">
            <div class="card-header">
              <span class="material-icons">person_off</span>
              <h2>Sin Pupilo</h2>
            </div>
            <div class="card-body">
              <p>No hay pupilo asignado</p>
            </div>
          </div>
        }
      </div>
      
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon asistencia">
            <span class="material-icons">check_circle</span>
          </div>
          <div class="stat-value">{{ getPresentes() }}/{{ asistencia().length }}</div>
          <div class="stat-label">Asistencias</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon evaluaciones">
            <span class="material-icons">assignment</span>
          </div>
          <div class="stat-value">{{ evaluaciones().length }}</div>
          <div class="stat-label">Evaluaciones</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon positivas">
            <span class="material-icons">thumb_up</span>
          </div>
          <div class="stat-value">{{ getAnotacionesPositivas() }}</div>
          <div class="stat-label">Anot. Positivas</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon negativas">
            <span class="material-icons">thumb_down</span>
          </div>
          <div class="stat-value">{{ getAnotacionesNegativas() }}</div>
          <div class="stat-label">Anot. Negativas</div>
        </div>
      </div>
      
      <!-- Content Grid -->
      <div class="card-grid">
        <!-- Asistencia -->
        <div class="content-card">
          <div class="card-header">
            <h3 class="card-title">
              <span class="material-icons">check_circle</span>
              Asistencia Reciente
            </h3>
          </div>
          <div class="card-body">
            @if (asistencia().length === 0) {
              <div class="empty-state">
                <span class="material-icons">info</span>
                <p>No hay registros de asistencia</p>
              </div>
            } @else {
              @for (asist of asistencia(); track asist.id) {
                <div class="list-item">
                  <div class="list-icon" [class.presente]="asist.presente" [class.falta]="!asist.presente">
                    <span class="material-icons">{{ asist.presente ? 'check_circle' : 'cancel' }}</span>
                  </div>
                  <div class="list-content">
                    <span class="title">{{ asist.presente ? 'Presente' : 'Ausente' }}</span>
                    <span class="subtitle">{{ asist.fecha }}</span>
                  </div>
                  @if (asist.observacion) {
                    <span class="badge-obs">{{ asist.observacion }}</span>
                  }
                </div>
              }
            }
          </div>
        </div>
        
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
                <p>No hay evaluaciones próximas</p>
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
        <div class="content-card full-width">
          <div class="card-header">
            <h3 class="card-title">
              <span class="material-icons">note</span>
              Anotaciones del Estudiante
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
    
    .page-container {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Cards Row - two cards side by side */
    .cards-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    
    /* Info Cards */
    .info-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    
    .info-card.azul {
      border-left: 4px solid #1e293b;
    }
    
    .info-card.verde {
      border-left: 4px solid #475569;
    }
    
    .info-card .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-card.azul .card-header {
      background: #1e293b;
      color: white;
    }
    
    .info-card.verde .card-header {
      background: #475569;
      color: white;
    }
    
    .info-card .card-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .info-card .card-header .material-icons {
      font-size: 22px;
    }
    
    .info-card .card-body {
      padding: 16px 20px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-row .label {
      color: #64748b;
      font-size: 0.875rem;
    }
    
    .info-row .value {
      color: #1e293b;
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .info-card.empty {
      text-align: center;
    }
    
    .info-card.empty .card-body p {
      color: #94a3b8;
      margin: 0;
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
    
    .stat-icon.asistencia { background: #1e293b; }
    .stat-icon.evaluaciones { background: #475569; }
    .stat-icon.positivas { background: #1e293b; }
    .stat-icon.negativas { background: #ef4444; }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .stat-label {
      color: #64748b;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
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
    
    .content-card.full-width {
      grid-column: span 2;
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
      color: #059669;
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
    
    .list-icon.presente { background: #22c55e; }
    .list-icon.falta { background: #ef4444; }
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
    }
    
    .list-content .subtitle {
      display: block;
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 2px;
    }
    
    .badge-obs {
      background: #fef3c7;
      color: #92400e;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
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
    
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .card-grid {
        grid-template-columns: 1fr;
      }
      
      .content-card.full-width {
        grid-column: span 1;
      }
    }
    
    @media (max-width: 768px) {
      .header-bar {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .student-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class DashboardApoderadoPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  
  estudiante = signal<Estudiante | null>(null);
  asistencia = signal<Asistencia[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  anotaciones = signal<Anotacion[]>([]);
  cursos = signal<Curso[]>([]);
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    // Get student based on logged-in user's ID (apoderado)
    const userId = this.auth.user()?.id;
    
    // Load cursos first
    this.api.getCursos().subscribe(data => this.cursos.set(data));
    
    this.api.getEstudiantes().subscribe(data => {
      // Find student where estudiante.apoderado_id matches user.id
      const student = data.find(s => s.apoderado_id === userId);
      if (student) {
        this.estudiante.set(student);
        // Load related data for this student
        this.loadStudentData(student.id!);
      }
      // If no student found, estudiante stays null and shows empty state
    });
  }
  
  loadStudentData(studentId: string): void {
    this.api.getAsistencia({ estudiante_id: studentId }).subscribe(data => this.asistencia.set(data));
    this.api.getEvaluaciones().subscribe(data => this.evaluaciones.set(data));
    this.api.getAnotaciones(studentId).subscribe(data => this.anotaciones.set(data));
  }
  
  getPresentes(): number {
    return this.asistencia().filter(a => a.presente).length;
  }
  
  getAnotacionesPositivas(): number {
    return this.anotaciones().filter(a => a.tipo === 'positiva').length;
  }
  
  getAnotacionesNegativas(): number {
    return this.anotaciones().filter(a => a.tipo === 'negativa').length;
  }
  
  getCursoNombre(cursoId: string | undefined): string {
    if (!cursoId) return 'Sin curso';
    const curso = this.cursos().find(c => c.id === cursoId);
    if (curso) {
      return curso.nivel || curso.nombre || 'Sin curso';
    }
    return 'Sin curso';
  }
  
  logout(): void {
    this.auth.logout();
  }
}
