import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Usuario, Estudiante, Curso, Recordatorio, AsignacionDocente } from '../../shared/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.css']
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly snackBar = inject(MatSnackBar);

  // Data signals
  usuarios = signal<Usuario[]>([]);
  estudiantes = signal<Estudiante[]>([]);
  cursos = signal<Curso[]>([]);
  recordatorios = signal<Recordatorio[]>([]);
  asignacionesDocente = signal<AsignacionDocente[]>([]);
  
  // Tab state
  activeTab = signal<'usuarios' | 'estudiantes' | 'cursos' | 'docentes'>('usuarios');
  
  // Mobile menu state
  showMobileMenu = signal(false);
  
  // Dialog states
  showUserDialog = signal(false);
  showStudentDialog = signal(false);
  showCursoDialog = signal(false);
  showRecordatorioDialog = signal(false);
  showAsignacionDocenteDialog = signal(false);
  showCursosPanel = signal(false);
  selectedCurso = signal<Curso | null>(null);
  
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
  
  // Recordatorio form
  recordatorioForm = {
    titulo: '',
    descripcion: '',
    fecha_limite: ''
  };
  
  // Asignacion docente form
  asignacionDocenteForm = {
    docente_id: '',
    curso_id: '',
    asignatura: ''
  };
  
  saving = signal(false);

  ngOnInit(): void {
    this.loadAll();
  }
  
  loadAll(): void {
    this.loadUsuarios();
    this.loadEstudiantes();
    this.loadCursos();
    this.loadRecordatorios();
    this.loadAsignacionesDocente();
  }
  
  loadRecordatorios(): void {
    const userId = this.auth.user()?.id;
    if (userId) {
      this.api.getRecordatorios(userId).subscribe({
        next: (data) => this.recordatorios.set(data),
        error: () => {}
      });
    }
  }
  
  loadAsignacionesDocente(): void {
    this.api.getAsignacionesDocente().subscribe({
      next: (data) => this.asignacionesDocente.set(data),
      error: () => {}
    });
  }
  
  // Toggle panel lateral
  toggleCursosPanel(): void {
    this.showCursosPanel.update(v => !v);
  }
  
  selectCurso(curso: Curso): void {
    this.selectedCurso.set(curso);
  }
  
  // Recordatorio methods
  openRecordatorioDialog(): void {
    this.recordatorioForm = { titulo: '', descripcion: '', fecha_limite: '' };
    this.showRecordatorioDialog.set(true);
  }
  
  closeRecordatorioDialog(): void {
    this.showRecordatorioDialog.set(false);
  }
  
  saveRecordatorio(): void {
    if (!this.recordatorioForm.titulo) {
      this.showMessage('Ingrese un título');
      return;
    }
    const userId = this.auth.user()?.id;
    if (!userId) return;
    
    this.saving.set(true);
    this.api.createRecordatorio({
      usuario_id: userId,
      titulo: this.recordatorioForm.titulo,
      descripcion: this.recordatorioForm.descripcion || '',
      fecha_limite: this.recordatorioForm.fecha_limite || undefined,
      completada: false
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showMessage('Recordatorio creado');
        this.closeRecordatorioDialog();
        this.loadRecordatorios();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Error creating recordatorio:', err);
        this.showMessage('Error al crear recordatorio');
      }
    });
  }
  
  toggleRecordatorioCompleted(rec: Recordatorio): void {
    if (rec.id) {
      this.api.updateRecordatorio(rec.id, { completada: !rec.completada }).subscribe({
        next: () => this.loadRecordatorios(),
        error: () => this.showMessage('Error')
      });
    }
  }
  
  deleteRecordatorio(rec: Recordatorio): void {
    if (rec.id && confirm('¿Eliminar?')) {
      this.api.deleteRecordatorio(rec.id).subscribe({
        next: () => { this.showMessage('Eliminado'); this.loadRecordatorios(); },
        error: () => this.showMessage('Error')
      });
    }
  }
  
  // Asignacion docente methods
  openAsignacionDocenteDialog(): void {
    this.asignacionDocenteForm = { docente_id: '', curso_id: '', asignatura: '' };
    this.showAsignacionDocenteDialog.set(true);
  }
  
  closeAsignacionDocenteDialog(): void {
    this.showAsignacionDocenteDialog.set(false);
  }
  
  saveAsignacionDocente(): void {
    if (!this.asignacionDocenteForm.docente_id || !this.asignacionDocenteForm.curso_id || !this.asignacionDocenteForm.asignatura) {
      this.showMessage('Complete todos los campos');
      return;
    }
    
    this.saving.set(true);
    console.log('DEBUG - Enviando datos:', {
      docente_id: this.asignacionDocenteForm.docente_id,
      curso_id: this.asignacionDocenteForm.curso_id,
      asignatura: this.asignacionDocenteForm.asignatura
    });
    
    this.api.createAsignacionDocente({
      docente_id: this.asignacionDocenteForm.docente_id,
      curso_id: this.asignacionDocenteForm.curso_id,
      asignatura: this.asignacionDocenteForm.asignatura
    }).subscribe({
      next: (data) => {
        console.log('DEBUG - Respuesta exitosa:', data);
        this.saving.set(false);
        this.showMessage('Asignación creada');
        this.closeAsignacionDocenteDialog();
        this.loadAsignacionesDocente();
      },
      error: (err) => {
        console.error('DEBUG - Error completo:', err);
        this.saving.set(false);
        const msg = err.error ? JSON.stringify(err.error) : 'Error al crear asignación';
        this.showMessage(msg);
      }
    });
  }
  
  deleteAsignacionDocente(asignacion: AsignacionDocente): void {
    if (asignacion.id && confirm('¿Eliminar esta asignación?')) {
      this.api.deleteAsignacionDocente(asignacion.id).subscribe({
        next: () => { this.showMessage('Asignación eliminada'); this.loadAsignacionesDocente(); },
        error: () => this.showMessage('Error')
      });
    }
  }
  
  getDocenteNombre(docenteId: string): string {
    const docente = this.usuarios().find(u => u.id === docenteId);
    return docente ? `${docente.nombre} ${docente.apellido}` : 'Docente';
  }
  
  getCursoNombre(cursoId: string | undefined): string {
    if (!cursoId) return 'Sin curso';
    const curso = this.cursos().find(c => c.id === cursoId);
    return curso ? `${curso.nivel} ${curso.nombre}` : 'Sin curso';
  }
  
  getDocentes(): Usuario[] {
    return this.usuarios().filter(u => u.rol === 'docente');
  }

  // Nuevo método para formatear nombre de curso
  getCursoNombreDisplay(cursoId: string | undefined): string {
    if (!cursoId) return 'Sin curso';
    const curso = this.cursos().find(c => c.id === cursoId);
    if (!curso) return 'Sin curso';
    // Formato: "6ºA - Básico" en lugar de "6° Básico 6° A"
    return `${curso.nombre} - ${curso.nivel}`;
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

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
}