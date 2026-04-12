import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Estudiante, Asistencia, Evaluacion, Anotacion, Curso, Recordatorio, Reunione, Nota } from '../../shared/models';

@Component({
  selector: 'app-dashboard-apoderado',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dashboard-apoderado.page.html',
  styleUrls: ['./dashboard-apoderado.page.css']
})
export class DashboardApoderadoPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  
  estudiante = signal<Estudiante | null>(null);
  asistencia = signal<Asistencia[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  anotaciones = signal<Anotacion[]>([]);
  cursos = signal<Curso[]>([]);
  recordatorios = signal<Recordatorio[]>([]);
  reuniones = signal<Reunione[]>([]);
  notas = signal<Nota[]>([]);
  
  // Vista activa
  activeSection = signal<'inicio' | 'notas' | 'asistencia' | 'anotaciones' | 'reuniones' | 'avisos' | 'solicitudes' | 'perfil'>('inicio');
  anoEscolar = new Date().getFullYear();
  
  // Modal state
  showRecordatorioModal = signal(false);
  showMobileMenu = signal(false);
  recordatorioForm = {
    titulo: '',
    descripcion: '',
    fecha_limite: ''
  };
  saving = signal(false);
  successMessage = signal('');
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    const userId = this.auth.user()?.id;
    
    // Load cursos first
    this.api.getCursos().subscribe(data => this.cursos.set(data));
    
    this.api.getEstudiantes().subscribe(data => {
      const student = data.find(s => s.apoderado_id === userId);
      if (student) {
        this.estudiante.set(student);
        this.loadStudentData(student.id!);
      }
    });
  }
  
  loadStudentData(studentId: string): void {
    const student = this.estudiante();
    
    this.api.getAsistencia({ estudiante_id: studentId }).subscribe(data => this.asistencia.set(data));
    
    // Cargar evaluaciones filtradas por el curso del estudiante
    if (student?.curso_id) {
      this.api.getEvaluaciones(student.curso_id).subscribe(data => this.evaluaciones.set(data));
    } else {
      this.api.getEvaluaciones().subscribe(data => this.evaluaciones.set(data));
    }
    
    this.api.getAnotaciones(studentId).subscribe(data => this.anotaciones.set(data));
    
    // Cargar notas del estudiante
    this.api.getNotas({ estudiante_id: studentId, ano_escolar: this.anoEscolar }).subscribe(data => this.notas.set(data));
    
    // Cargar reuniones del curso del estudiante
    if (student?.curso_id) {
      this.api.getReuniones(student.curso_id).subscribe(data => {
        this.reuniones.set(data);
      });
    }
    
    // Load recordatorios
    const userId = this.auth.user()?.id;
    if (userId) {
      this.api.getRecordatorios(userId).subscribe(data => this.recordatorios.set(data));
    }
  }
  
  // Navigation
  setSection(section: 'inicio' | 'notas' | 'asistencia' | 'anotaciones' | 'reuniones' | 'avisos' | 'solicitudes' | 'perfil'): void {
    this.activeSection.set(section);
    this.closeMobileMenu();
  }
  
  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }
  
  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
  
  // Recordatorio methods
  openRecordatorioDialog(): void {
    this.recordatorioForm = { titulo: '', descripcion: '', fecha_limite: '' };
    this.showRecordatorioModal.set(true);
  }
  
  closeRecordatorioModal(): void {
    this.showRecordatorioModal.set(false);
  }
  
  saveRecordatorio(): void {
    if (!this.recordatorioForm.titulo) {
      alert('Ingrese un título');
      return;
    }
    const userId = this.auth.user()?.id || (this.auth.user() as any)?._id;
    if (!userId) {
      console.error('No hay userId disponible');
      return;
    }
    
    this.saving.set(true);
    this.api.createRecordatorio({
      usuario_id: userId,
      titulo: this.recordatorioForm.titulo,
      descripcion: this.recordatorioForm.descripcion || '',
      fecha_limite: this.normalizeDate(this.recordatorioForm.fecha_limite),
      completada: false
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('Recordatorio creado');
        this.closeRecordatorioModal();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Error creating recordatorio:', err);
        alert('Error al crear recordatorio');
      }
    });
  }
  
  toggleRecordatorioCompleted(rec: Recordatorio): void {
    if (rec.id) {
      this.api.updateRecordatorio(rec.id, { completada: !rec.completada }).subscribe({
        next: () => this.loadData(),
        error: () => alert('Error')
      });
    }
  }
  
  deleteRecordatorio(rec: Recordatorio): void {
    if (rec.id && confirm('¿Eliminar?')) {
      this.api.deleteRecordatorio(rec.id).subscribe({
        next: () => { this.showSuccess('Eliminado'); this.loadData(); },
        error: () => alert('Error')
      });
    }
  }
  
  showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
  
  getPresentes(): number {
    return this.asistencia().filter(a => a.presente).length;
  }
  
  getTotalAsistencias(): number {
    return this.asistencia().length;
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
  
  // Reuniones
  getReunionesPasadas(): Reunione[] {
    const hoy = new Date().toISOString().split('T')[0];
    return this.reuniones().filter(r => r.fecha < hoy);
  }
  
  getReunionesProximas(): Reunione[] {
    const hoy = new Date().toISOString().split('T')[0];
    return this.reuniones().filter(r => r.fecha >= hoy);
  }

  // Array para iterar las 6 notas
  get numerosNota(): string[] {
    return ['nota1', 'nota2', 'nota3', 'nota4', 'nota5', 'nota6'];
  }

  getNotaDisplay(notas: any, num: string): string {
    if (!notas) return '-';
    const val = notas[num];
    return val !== undefined && val !== null ? String(val) : '-';
  }

  isNotaVacia(notas: any, num: string): boolean {
    if (!notas) return true;
    return notas[num] === undefined || notas[num] === null;
  }
  
  logout(): void {
    this.auth.logout();
  }
  
  // Normalizar fecha para el backend
  private normalizeDate(dateStr: string | undefined): string | undefined {
    if (!dateStr) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  }
}