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
import { ThemeService } from '../../core/services/theme.service';
import { Curso, Evaluacion, Anotacion, Estudiante, Asistencia, Reunione, Recordatorio, AsignacionDocente, Nota } from '../../shared/models';

interface CursoAsignado extends Curso {
  asignatura?: string;
  asignacion_id?: string;
}

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
  templateUrl: './dashboard-docente.page.html',
  styleUrls: ['./dashboard-docente.page.css']
})
export class DashboardDocentePage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  
  // Cursos asignados al docente
  cursosAsignados = signal<CursoAsignado[]>([]);
  
  // Todos los datos
  cursos = signal<Curso[]>([]);
  estudiantes = signal<Estudiante[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  anotaciones = signal<Anotacion[]>([]);
  recordatorios = signal<Recordatorio[]>([]);
  asignacionesDocente = signal<AsignacionDocente[]>([]);
  
  // Notas de estudiantes
  notasEstudiantes = signal<Nota[]>([]);
  
  // Vista actual
  activeView = signal<'dashboard' | 'cursos' | 'asistencia' | 'evaluaciones' | 'anotaciones' | 'reuniones' | 'notas'>('dashboard');
  
  // Modal states
  showAsistenciaModal = signal(false);
  showEvaluacionModal = signal(false);
  showEvaluacionEditModal = signal(false);
  showAnotacionModal = signal(false);
  showReunionModal = signal(false);
  showRecordatorioModal = signal(false);
  showNotasModal = signal(false);
  showCursosPanel = signal(false);
  showMobileMenu = signal(false);
  
  selectedCurso = signal<Curso | null>(null);
  selectedAsignatura = signal<string>('');
  selectedEvaluacion = signal<Evaluacion | null>(null);
  saving = signal(false);
  successMessage = signal('');
  anoEscolar = new Date().getFullYear();
  
  // Asistencia signals
  cursoTab = signal<'notas' | 'asistencia'>('notas');
  asistenciaHoy: Record<string, boolean> = {};
  fechaAsistenciaHoy = new Date().toISOString().split('T')[0];
  
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
  
  recordatorioForm = {
    titulo: '',
    descripcion: '',
    fecha_limite: ''
  };
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.api.getCursos().subscribe(data => this.cursos.set(data));
    this.api.getEstudiantes().subscribe(data => this.estudiantes.set(data));
    this.api.getEvaluaciones().subscribe(data => this.evaluaciones.set(data));
    this.api.getAnotaciones().subscribe(data => this.anotaciones.set(data));
    
    // Cargar recordatorios del usuario actual
    const userId = this.auth.user()?.id;
    if (userId) {
      this.api.getRecordatorios(userId).subscribe(data => this.recordatorios.set(data));
    }
    
    // Cargar asignaciones del docente
    this.api.getAsignacionesDocente().subscribe(data => {
      this.asignacionesDocente.set(data);
      this.cargarCursosAsignados();
    });
  }

  cargarCursosAsignados(): void {
    const docenteId = this.auth.user()?.id;
    if (!docenteId) return;

    const misAsignaciones = this.asignacionesDocente().filter(a => a.docente_id === docenteId);
    const cursos: CursoAsignado[] = [];

    for (const asig of misAsignaciones) {
      const curso = this.cursos().find(c => c.id === asig.curso_id);
      if (curso) {
        cursos.push({
          ...curso,
          asignatura: asig.asignatura,
          asignacion_id: asig.id
        });
      }
    }

    this.cursosAsignados.set(cursos);
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
    this.selectedEvaluacion.set(null);
    this.showEvaluacionModal.set(true);
  }
  
  openEvaluacionEditDialog(evaluacion: Evaluacion): void {
    this.evaluacionForm = {
      cursoId: evaluacion.curso_id || '',
      materia: evaluacion.materia || '',
      titulo: evaluacion.titulo || '',
      descripcion: evaluacion.descripcion || '',
      fecha: evaluacion.fecha || '',
      ponderacion: evaluacion.ponderacion || 20
    };
    this.selectedEvaluacion.set(evaluacion);
    this.showEvaluacionEditModal.set(true);
  }
  
  closeModals(): void {
    this.showAsistenciaModal.set(false);
    this.showEvaluacionModal.set(false);
    this.showEvaluacionEditModal.set(false);
    this.showAnotacionModal.set(false);
    this.showReunionModal.set(false);
    this.showRecordatorioModal.set(false);
    this.selectedEvaluacion.set(null);
  }
  
  openAnotacionDialog(): void {
    // Si hay un curso seleccionado, cargar sus estudiantes primero
    if (this.selectedCurso()?.id) {
      this.api.getEstudiantes(this.selectedCurso()!.id).subscribe(data => {
        this.estudiantes.set(data);
      });
    } else if (this.cursosAsignados().length > 0) {
      // Cargar estudiantes del primer curso asignado
      const primerCurso = this.cursosAsignados()[0];
      if (primerCurso.id) {
        this.api.getEstudiantes(primerCurso.id).subscribe(data => {
          this.estudiantes.set(data);
        });
      }
    }
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
  
  openRecordatorioDialog(): void {
    this.recordatorioForm = {
      titulo: '',
      descripcion: '',
      fecha_limite: ''
    };
    this.showRecordatorioModal.set(true);
  }
  
  selectCurso(curso: Curso): void {
    this.selectedCurso.set(curso);
    if (curso.id) {
      this.api.getEstudiantes(curso.id).subscribe(data => {
        this.estudiantes.set(data);
      });
    }
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
      fecha: this.normalizeDate(this.evaluacionForm.fecha),
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
  
  updateEvaluacion(): void {
    const evaluacion = this.selectedEvaluacion();
    if (!evaluacion?.id) return;
    
    if (!this.evaluacionForm.cursoId || !this.evaluacionForm.materia || !this.evaluacionForm.titulo || !this.evaluacionForm.fecha) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.saving.set(true);
    this.api.updateEvaluacion(evaluacion.id, {
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
        this.showSuccess('Evaluación actualizada correctamente');
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al actualizar evaluación');
      }
    });
  }
  
  deleteEvaluacion(evaluacion: Evaluacion): void {
    if (evaluacion.id && confirm('¿Eliminar esta evaluación?')) {
      this.api.deleteEvaluacion(evaluacion.id).subscribe({
        next: () => {
          this.showSuccess('Evaluación eliminada');
          this.loadData();
        },
        error: () => alert('Error al eliminar evaluación')
      });
    }
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
      fecha: this.normalizeDate(this.anotacionForm.fecha)
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
      fecha: this.normalizeDate(this.reunionForm.fecha),
      hora: this.reunionForm.hora,
      lugar: this.reunionForm.lugar,
      descripcion: this.reunionForm.descripcion || '',
      notificacion_enviada: false
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Reunión programada correctamente');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Error al crear reunión:', err);
        alert('Error al programar reunión. Verifique los datos e intente nuevamente.');
      }
    });
  }
  
  saveRecordatorio(): void {
    if (!this.recordatorioForm.titulo) {
      alert('Por favor ingrese un título');
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
      descripcion: this.recordatorioForm.descripcion,
      fecha_limite: this.normalizeDate(this.recordatorioForm.fecha_limite),
      completada: false
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModals();
        this.showSuccess('Recordatorio creado correctamente');
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al crear recordatorio');
      }
    });
  }
  
  toggleRecordatorioCompleted(recordatorio: Recordatorio): void {
    if (recordatorio.id) {
      this.api.updateRecordatorio(recordatorio.id, {
        completada: !recordatorio.completada
      }).subscribe({
        next: () => this.loadData(),
        error: () => alert('Error al actualizar recordatorio')
      });
    }
  }
  
  deleteRecordatorio(recordatorio: Recordatorio): void {
    if (recordatorio.id && confirm('¿Eliminar este recordatorio?')) {
      this.api.deleteRecordatorio(recordatorio.id).subscribe({
        next: () => {
          this.showSuccess('Recordatorio eliminado');
          this.loadData();
        },
        error: () => alert('Error al eliminar recordatorio')
      });
    }
  }
  
  getCursoNombre(cursoId: string): string {
    const curso = this.cursos().find(c => c.id === cursoId);
    return curso ? `${curso.nivel} ${curso.nombre}` : 'Curso';
  }

  // Cambiar vista
  setView(view: 'dashboard' | 'cursos' | 'asistencia' | 'evaluaciones' | 'anotaciones' | 'reuniones' | 'notas'): void {
    this.activeView.set(view);
    this.closeMobileMenu();
  }

  // Seleccionar curso para ver detalle
  seleccionarCurso(curso: CursoAsignado): void {
    this.selectedCurso.set(curso);
    this.selectedAsignatura.set(curso.asignatura || '');
    
    // Cargar estudiantes del curso
    if (curso.id) {
      this.api.getEstudiantes(curso.id).subscribe(data => {
        this.estudiantes.set(data);
        this.loadNotasEstudiantes(curso.id!, curso.asignatura || '');
      });
    }
  }

  loadNotasEstudiantes(cursoId: string, asignatura: string): void {
    this.api.getNotas({ curso_id: cursoId, ano_escolar: this.anoEscolar }).subscribe(data => {
      // Filtrar por asignatura
      this.notasEstudiantes.set(data.filter(n => n.asignatura === asignatura));
    });
  }

  // Guardar nota de un estudiante
  guardarNota(estudianteId: string, numeroNota: string, valor: string): void {
    const curso = this.selectedCurso();
    if (!curso?.id || !this.selectedAsignatura()) return;

    // Convertir valor a número, si es vacío usar undefined
    const notaValor = valor ? parseFloat(valor) : undefined;
    if (notaValor !== undefined && (notaValor < 1 || notaValor > 7)) {
      alert('La nota debe estar entre 1 y 7');
      return;
    }

    this.api.actualizarNotaSimple({
      estudiante_id: estudianteId,
      curso_id: curso.id,
      asignatura: this.selectedAsignatura(),
      ano_escolar: this.anoEscolar,
      numero_nota: numeroNota,
      valor: notaValor as number
    }).subscribe({
      next: () => {
        this.showSuccess('Nota guardada correctamente');
        this.loadNotasEstudiantes(curso.id!, this.selectedAsignatura());
      },
      error: () => alert('Error al guardar nota')
    });
  }

  getNotaEstudiante(estudianteId: string): Nota | undefined {
    return this.notasEstudiantes().find(n => n.estudiante_id === estudianteId);
  }

  getNotaValor(nota: Nota | undefined, num: string): string {
    if (!nota?.notas) return '';
    const val = nota.notas[num];
    return val !== undefined && val !== null ? String(val) : '';
  }

  // Estudiantes ordenados alfabéticamente
  get estudiantesOrdenados(): Estudiante[] {
    return [...this.estudiantes()].sort((a, b) => {
      const cmp = a.apellido.localeCompare(b.apellido);
      if (cmp !== 0) return cmp;
      const cmp2 = a.nombre.localeCompare(b.nombre);
      return cmp2;
    });
  }

  // Array para iterar las 6 notas
  get numerosNota(): string[] {
    return ['nota1', 'nota2', 'nota3', 'nota4', 'nota5', 'nota6'];
  }

  // Menú móvil
  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
  
  // Asistencia por curso
  toggleAsistenciaEstudiante(estudianteId: string): void {
    this.asistenciaHoy[estudianteId] = !this.asistenciaHoy[estudianteId];
  }
  
  loadAsistenciaCurso(): void {
    const curso = this.selectedCurso();
    if (!curso?.id) return;
    
    // Inicializar todos como presentes por defecto
    this.estudiantes().forEach(est => {
      if (est.id) this.asistenciaHoy[est.id] = true;
    });
    
    // Cargar asistencia del día de hoy para este curso
    this.api.getAsistencia({ 
      curso_id: curso.id,
      fecha: this.fechaAsistenciaHoy
    }).subscribe(data => {
      // Si hay registros, actualizar el estado
      if (data && data.length > 0) {
        data.forEach((a: any) => {
          if (a.estudiante_id) {
            this.asistenciaHoy[a.estudiante_id] = a.presente ?? true;
          }
        });
      }
    });
  }
  
  guardarAsistenciaHoy(): void {
    const curso = this.selectedCurso();
    if (!curso?.id) return;
    
    const registros = this.estudiantes()
      .filter(e => e.id)
      .map(e => ({ 
        estudiante_id: e.id!, 
        presente: this.asistenciaHoy[e.id!] ?? true 
      }));
    
    this.saving.set(true);
    this.api.createAsistenciaBulk({
      curso_id: curso.id,
      fecha: this.fechaAsistenciaHoy,
      registros
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('Asistencia guardada');
        this.loadAsistenciaCurso();
      },
      error: () => { 
        this.saving.set(false); 
        alert('Error al guardar asistencia'); 
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
  
  // Normalizar fecha para el backend
  private normalizeDate(dateStr: string | undefined): string | undefined {
    if (!dateStr) return dateStr;
    // Si ya está en formato YYYY-MM-DD, retornar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Si está en DD-MM-YYYY, convertir
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  }
}