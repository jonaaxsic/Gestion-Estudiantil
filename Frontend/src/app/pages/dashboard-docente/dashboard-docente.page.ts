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
import { SharedTabsComponent, SharedCardComponent, TabItem } from '../../shared/components';
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
    SharedTabsComponent,
    SharedCardComponent,
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
  reuniones = signal<Reunione[]>([]);
  recordatorios = signal<Recordatorio[]>([]);
  asignacionesDocente = signal<AsignacionDocente[]>([]);
  
  // Notas de estudiantes
  notasEstudiantes = signal<Nota[]>([]);
  
  // Vista actual
  activeView = signal<'dashboard' | 'cursos' | 'asistencia' | 'evaluaciones' | 'anotaciones' | 'reuniones' | 'notas'>('dashboard');
  
  // Tab index para el componente compartido
  get tabIndex(): number {
    const tabs = ['dashboard', 'cursos', 'asistencia', 'evaluaciones', 'anotaciones', 'reuniones'];
    return tabs.indexOf(this.activeView());
  }
  
  set tabIndex(index: number) {
    const views: ('dashboard' | 'cursos' | 'asistencia' | 'evaluaciones' | 'anotaciones' | 'reuniones' | 'notas')[] = ['dashboard', 'cursos', 'asistencia', 'evaluaciones', 'anotaciones', 'reuniones', 'notas'];
    if (index >= 0 && index < views.length) {
      this.activeView.set(views[index]);
    }
  }
  
  // Tabs para el componente compartido
  docenteTabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'cursos', label: 'Cursos', icon: 'class' },
    { id: 'asistencia', label: 'Asistencia', icon: 'how_to_reg' },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: 'assignment' },
    { id: 'anotaciones', label: 'Anotaciones', icon: 'note_add' },
    { id: 'reuniones', label: 'Reuniones', icon: 'event' }
  ];
  
  onDocenteTabChanged(tabId: string): void {
    this.activeView.set(tabId as any);
  }
  
  // Panel states para mostrar listados con opción de crear
  showAsistenciaList = signal(false);
  showEvaluacionesList = signal(false);
  showAnotacionesList = signal(false);
  showReunionesList = signal(false);
  
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
  cursoTab = signal<'notas' | 'asistencia' | 'reuniones' | 'anotaciones' | 'evaluaciones'>('notas');
  asistenciaHoy: Record<string, boolean> = {};
  fechaAsistenciaHoy = new Date().toISOString().split('T')[0];
  fechaSeleccionada = signal<string>(new Date().toISOString().split('T')[0]);
  
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
    // Optimizado: cargar solo datos esenciales primero (cursos + asignaciones)
    // Los datos adicionales (estudiantes, evaluaciones, etc) se cargan bajo demanda
    
    // 1. Cargar cursos (cached en backend)
    this.api.getCursos().subscribe(data => this.cursos.set(data));
    
    // 2. Cargar asignaciones del docente (cached en backend)
    const userId = this.auth.user()?.id;
    if (userId) {
      this.api.getAsignacionesDocente(userId).subscribe(data => {
        this.asignacionesDocente.set(data);
        this.cargarCursosAsignados();
        // Solo cargar evaluaciones/anotaciones si hay cursos asignados
        if (this.cursosAsignados().length > 0) {
          this.cargarEvaluacionesFiltradas();
        }
      });
      
      // Cargar recordatorios (datos pequeños, rápido)
      this.api.getRecordatorios(userId).subscribe(data => this.recordatorios.set(data));
    }
  }

  // Cargar estudiantes SOLO cuando se necesita (lazy loading)
  loadEstudiantesIfNeeded(): void {
    if (this.estudiantes().length > 0) return; // Ya cargados
    
    const cursoIds = this.cursosAsignados().map(c => c.id).filter(id => id);
    if (cursoIds.length > 0) {
      // Cargar estudiantes del primer curso para el modal de asistencia
      this.api.getEstudiantes(cursoIds[0]).subscribe(data => this.estudiantes.set(data));
    }
  }

  // Cargar evaluaciones bajo demanda (solo cuando se necesita)
  loadEvaluacionesIfNeeded(): void {
    if (this.evaluaciones().length > 0) return;
    this.cargarEvaluacionesFiltradas();
  }

  // Cargar anotaciones bajo demanda
  loadAnotacionesIfNeeded(): void {
    if (this.anotaciones().length > 0) return;
    this.cargarAnotacionesFiltradas();
  }

  // Cargar reuniones bajo demanda
  loadReunionesIfNeeded(): void {
    if (this.reuniones().length > 0) return;
    this.cargarReunionesFiltradas();
  }

  cargarEvaluacionesFiltradas(): void {
    const cursoIds = this.cursosAsignados().map(c => c.id).filter(id => id);
    if (cursoIds.length === 0) {
      this.evaluaciones.set([]);
      return;
    }
    
    // Cargar evaluaciones para cada curso asignado
    this.evaluaciones.set([]);
    cursoIds.forEach(cursoId => {
      this.api.getEvaluaciones(cursoId).subscribe(data => {
        const current = this.evaluaciones();
        const newData = data.filter(e => !current.some(existing => existing.id === e.id));
        this.evaluaciones.set([...current, ...newData]);
      });
    });
  }

  cargarAnotacionesFiltradas(): void {
    const cursoIds = this.cursosAsignados().map(c => c.id).filter(id => id);
    if (cursoIds.length === 0) {
      this.anotaciones.set([]);
      return;
    }
    
    // Obtener estudiantes de los cursos del docente
    const estudiantesDelCurso = this.estudiantes().filter(e => e.curso_id && cursoIds.includes(e.curso_id));
    const estudianteIds = estudiantesDelCurso.map(e => e.id).filter(id => id);
    
    if (estudianteIds.length === 0) {
      this.anotaciones.set([]);
      return;
    }
    
    // Cargar anotaciones de esos estudiantes
    this.anotaciones.set([]);
    estudianteIds.forEach(estId => {
      this.api.getAnotaciones(estId).subscribe(data => {
        const current = this.anotaciones();
        const newData = data.filter(a => !current.some(existing => existing.id === a.id));
        this.anotaciones.set([...current, ...newData]);
      });
    });
  }

  cargarReunionesFiltradas(): void {
    const cursoIds = this.cursosAsignados().map(c => c.id).filter(id => id);
    if (cursoIds.length === 0) {
      this.reuniones.set([]);
      return;
    }
    
    this.reuniones.set([]);
    cursoIds.forEach(cursoId => {
      this.api.getReuniones(cursoId).subscribe(data => {
        const current = this.reuniones();
        const newData = data.filter(r => !current.some(existing => existing.id === r.id));
        this.reuniones.set([...current, ...newData]);
      });
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
    // Lazy loading: cargar estudiantes solo cuando se abre el modal
    this.loadEstudiantesIfNeeded();
    
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
    // Lazy loading: cargar estudiantes solo cuando se necesita
    this.loadEstudiantesIfNeeded();
    
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
    // Cerrar cualquier panel de lista cuando se cambia de vista
    this.showAsistenciaList.set(false);
    this.showEvaluacionesList.set(false);
    this.showAnotacionesList.set(false);
    this.showReunionesList.set(false);
    this.closeMobileMenu();
  }
  
  // Abrir panel de lista de asistencia
  openAsistenciaList(): void {
    this.showAsistenciaList.set(true);
    this.setView('asistencia');
  }
  
  // Cerrar panel de lista de asistencia
  closeAsistenciaList(): void {
    this.showAsistenciaList.set(false);
  }
  
  // Abrir panel de lista de evaluaciones
  openEvaluacionesList(): void {
    this.showEvaluacionesList.set(true);
    this.setView('evaluaciones');
  }
  
  // Cerrar panel de lista de evaluaciones
  closeEvaluacionesList(): void {
    this.showEvaluacionesList.set(false);
  }
  
  // Abrir panel de lista de anotaciones
  openAnotacionesList(): void {
    this.showAnotacionesList.set(true);
    this.setView('anotaciones');
  }
  
  // Cerrar panel de lista de anotaciones
  closeAnotacionesList(): void {
    this.showAnotacionesList.set(false);
  }
  
  // Abrir panel de lista de reuniones
  openReunionesList(): void {
    this.showReunionesList.set(true);
    this.setView('reuniones');
  }
  
  // Cerrar panel de lista de reuniones
  closeReunionesList(): void {
    this.showReunionesList.set(false);
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
    
    // Usar la fecha seleccionada
    const fecha = this.fechaSeleccionada();
    
    // Inicializar todos como presentes por defecto
    this.estudiantes().forEach(est => {
      if (est.id) this.asistenciaHoy[est.id] = true;
    });
    
    // Cargar asistencia de la fecha seleccionada para este curso
    this.api.getAsistencia({ 
      curso_id: curso.id,
      fecha: fecha
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
  
  onFechaSeleccionadaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaSeleccionada.set(input.value);
    this.loadAsistenciaCurso();
  }
  
  // Obtener estadísticas de asistencia del mes
  getEstadisticasAsistenciaMes(): { presentes: number; ausentes: number; porcentaje: number } {
    const curso = this.selectedCurso();
    if (!curso?.id) return { presentes: 0, ausentes: 0, porcentaje: 0 };
    
    const estudianteIds = this.estudiantes().filter(e => e.curso_id === curso.id).map(e => e.id);
    const asistenciaMes = this.api.getAsistencia({ curso_id: curso.id }).subscribe;
    
    // Por ahora devolver datos básicos
    const total = this.estudiantes().length;
    const presentes = Object.values(this.asistenciaHoy).filter(v => v).length;
    const ausentes = total - presentes;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    
    return { presentes, ausentes, porcentaje };
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
  
  // ============== Métodos para tabs del detalle del curso ==============
  
  // Reuniones
  getReunionesDelCurso(): Reunione[] {
    const cursoId = this.selectedCurso()?.id;
    if (!cursoId) return [];
    return this.reuniones().filter(r => r.curso_id === cursoId);
  }
  
  esReunionProxima(fecha: string): boolean {
    const hoy = new Date();
    const fechaReunion = new Date(fecha);
    const diffDays = Math.ceil((fechaReunion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }
  
  esReunionPasada(fecha: string): boolean {
    const hoy = new Date();
    const fechaReunion = new Date(fecha);
    return fechaReunion < hoy;
  }
  
  // Evaluaciones
  getEvaluacionesDelCurso(): Evaluacion[] {
    const cursoId = this.selectedCurso()?.id;
    if (!cursoId) return [];
    return this.evaluaciones().filter(e => e.curso_id === cursoId);
  }
  
  esEvaluacionProxima(fecha: string): boolean {
    const hoy = new Date();
    const fechaEval = new Date(fecha);
    const diffDays = Math.ceil((fechaEval.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }
  
  esEvaluacionPasada(fecha: string): boolean {
    const hoy = new Date();
    const fechaEval = new Date(fecha);
    return fechaEval < hoy;
  }
  
  // Anotaciones
  getAnotacionesDelCurso(): Anotacion[] {
    const cursoId = this.selectedCurso()?.id;
    if (!cursoId) return [];
    const estudianteIds = this.estudiantes().filter(e => e.curso_id === cursoId).map(e => e.id);
    return this.anotaciones().filter(a => a.estudiante_id && estudianteIds.includes(a.estudiante_id));
  }
  
  getEstudiantesConAnotaciones(): Estudiante[] {
    const cursoId = this.selectedCurso()?.id;
    if (!cursoId) return [];
    const estudianteIdsConAnot = [...new Set(this.anotaciones()
      .filter(a => {
        const est = this.estudiantes().find(e => e.id === a.estudiante_id);
        return est?.curso_id === cursoId;
      })
      .map(a => a.estudiante_id))];
    return this.estudiantes().filter(e => e.curso_id === cursoId && estudianteIdsConAnot.includes(e.id!));
  }
  
  getAnotacionesPositivasEstudiante(estudianteId: string): number {
    return this.anotaciones().filter(a => a.estudiante_id === estudianteId && a.tipo === 'positiva').length;
  }
  
  getAnotacionesNegativasEstudiante(estudianteId: string): number {
    return this.anotaciones().filter(a => a.estudiante_id === estudianteId && a.tipo === 'negativa').length;
  }
}