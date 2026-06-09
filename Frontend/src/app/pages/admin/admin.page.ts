import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AdminDataService } from './services/admin-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SharedTabsComponent, SharedHeaderComponent, TabItem, SettingsPanelComponent } from '../../shared/components';
import { Usuario, Estudiante, Curso, Recordatorio, AsignacionDocente } from '../../shared/models';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';
import { AdminEstudiantesComponent } from './components/admin-estudiantes/admin-estudiantes.component';
import { AdminCursosComponent } from './components/admin-cursos/admin-cursos.component';
import { AdminDocentesComponent } from './components/admin-docentes/admin-docentes.component';
import { AdminRecordatoriosComponent } from './components/admin-recordatorios/admin-recordatorios.component';
import { AdminApoderadosComponent } from './components/admin-apoderados/admin-apoderados.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatCardModule,
    SharedTabsComponent, SharedHeaderComponent, SettingsPanelComponent,
    AdminUsuariosComponent, AdminEstudiantesComponent, AdminCursosComponent,
    AdminDocentesComponent, AdminRecordatoriosComponent, AdminApoderadosComponent,
  ],
  templateUrl: './admin.page.html',
  styleUrls: ['_admin-shared-ui.css', '_admin-shared-docentes.css', '_admin-shared-responsive.css', './admin.page.css']
})
export class AdminPage implements OnInit {
  readonly data = inject(AdminDataService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  successMessage = signal('');
  activeTab = signal<'usuarios' | 'estudiantes' | 'cursos' | 'docentes' | 'recordatorios' | 'apoderados' | 'configuracion'>('usuarios');
  showMobileMenu = signal(false);
  showCursosPanel = signal(false);
  selectedCurso = signal<Curso | null>(null);

  // Dialog states
  showUserDialog = signal(false);
  showStudentDialog = signal(false);
  showCursoDialog = signal(false);
  showRecordatorioDialog = signal(false);
  showAsignacionDocenteDialog = signal(false);

  // Editing
  editingUser = signal<Usuario | null>(null);
  editingStudent = signal<Estudiante | null>(null);
  editingCurso = signal<Curso | null>(null);

  // Forms
  userForm: Partial<Usuario> = { rut: '', nombre: '', apellido: '', email: '', username: '', password: '', telefono: '', rol: 'docente', activo: true };
  studentForm: Partial<Estudiante> = { rut: '', nombre: '', apellido: '', fecha_nacimiento: '', direccion: '', telefono: '', curso_id: '', apoderado_id: '' };
  cursoForm: Partial<Curso> = { nombre: '', nivel: '', ano: new Date().getFullYear() };
  recordatorioForm = { titulo: '', descripcion: '', fecha_limite: '' };
  asignacionDocenteForm = { docente_id: '', curso_id: '', asignatura: '' };
  saving = signal(false);

  adminTabs: TabItem[] = [
    { id: 'usuarios', label: 'Usuarios', icon: 'people' },
    { id: 'estudiantes', label: 'Estudiantes', icon: 'school' },
    { id: 'cursos', label: 'Cursos', icon: 'class' },
    { id: 'docentes', label: 'Docentes', icon: 'co_present' },
    { id: 'recordatorios', label: 'Recordatorios', icon: 'notifications' },
    { id: 'apoderados', label: 'Apoderados', icon: 'family_restroom' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' }
  ];

  get tabIndex(): number {
    const tabs = ['usuarios', 'estudiantes', 'cursos', 'docentes', 'recordatorios', 'apoderados', 'configuracion'];
    return tabs.indexOf(this.activeTab());
  }

  set tabIndex(index: number) {
    const tabs = ['usuarios', 'estudiantes', 'cursos', 'docentes', 'recordatorios', 'apoderados', 'configuracion'];
    if (index >= 0 && index < tabs.length) this.activeTab.set(tabs[index] as any);
  }

  ngOnInit(): void { this.data.loadAll(); }
  onTabChanged(tabId: string): void { this.activeTab.set(tabId as any); }

  // ===== Mobile & Panel =====
  toggleMobileMenu(): void { this.showMobileMenu.update(v => !v); }
  closeMobileMenu(): void { this.showMobileMenu.set(false); }
  toggleCursosPanel(): void { this.showCursosPanel.update(v => !v); }
  selectCurso(curso: Curso): void { this.selectedCurso.set(curso); }
  logout(): void { this.auth.logout(); }

  // ===== USER Dialog =====
  openUserDialog(user?: Usuario): void {
    if (user) {
      this.editingUser.set(user);
      this.userForm = { ...user };
    } else {
      this.editingUser.set(null);
      this.userForm = { rut: '', nombre: '', apellido: '', email: '', username: '', password: '', telefono: '', rol: 'docente', activo: true };
    }
    this.showUserDialog.set(true);
  }
  closeUserDialog(): void { this.showUserDialog.set(false); this.editingUser.set(null); }
  saveUser(): void {
    const user = this.editingUser();
    if (user?.id) {
      this.data.updateUsuario(user.id, this.userForm).subscribe({
        next: () => { this.showMessage('Usuario actualizado correctamente'); this.data.loadUsuarios(); this.closeUserDialog(); },
        error: (err) => { this.showMessage(err.error?.error || 'Error al actualizar usuario'); }
      });
    } else {
      this.data.createUsuario(this.userForm).subscribe({
        next: () => { this.showMessage('Usuario creado correctamente'); this.data.loadUsuarios(); this.closeUserDialog(); },
        error: (err) => { this.showMessage(err.error?.error || 'Error al crear usuario'); }
      });
    }
  }
  deleteUserFromChild(user: Usuario): void {
    if (confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) {
      if (user.id) {
        this.data.deleteUsuario(user.id).subscribe({
          next: () => { this.showMessage('Usuario eliminado correctamente'); this.data.loadUsuarios(); },
          error: () => this.showMessage('Error al eliminar usuario')
        });
      }
    }
  }

  // ===== STUDENT Dialog =====
  openStudentDialog(student?: Estudiante): void {
    if (student) {
      this.editingStudent.set(student);
      this.studentForm = { ...student };
    } else {
      this.editingStudent.set(null);
      this.studentForm = { rut: '', nombre: '', apellido: '', fecha_nacimiento: '', direccion: '', telefono: '', curso_id: '', apoderado_id: '' };
    }
    this.showStudentDialog.set(true);
  }
  closeStudentDialog(): void { this.showStudentDialog.set(false); this.editingStudent.set(null); }
  saveStudent(): void {
    const student = this.editingStudent();
    if (student?.id) {
      this.data.updateEstudiante(student.id, this.studentForm).subscribe({
        next: () => { this.showMessage('Estudiante actualizado correctamente'); this.data.loadEstudiantes(); this.closeStudentDialog(); },
        error: () => this.showMessage('Error al actualizar estudiante')
      });
    } else {
      this.data.createEstudiante(this.studentForm).subscribe({
        next: () => { this.showMessage('Estudiante creado correctamente'); this.data.loadEstudiantes(); this.closeStudentDialog(); },
        error: () => this.showMessage('Error al crear estudiante')
      });
    }
  }
  deleteStudentFromChild(student: Estudiante): void {
    if (confirm(`¿Estás seguro de eliminar a ${student.nombre}?`)) {
      if (student.id) {
        this.data.deleteEstudiante(student.id).subscribe({
          next: () => { this.showMessage('Estudiante eliminado correctamente'); this.data.loadEstudiantes(); },
          error: () => this.showMessage('Error al eliminar estudiante')
        });
      }
    }
  }

  // ===== CURSO Dialog =====
  openCursoDialog(curso?: Curso): void {
    if (curso) {
      this.editingCurso.set(curso);
      this.cursoForm = { ...curso };
    } else {
      this.editingCurso.set(null);
      this.cursoForm = { nombre: '', nivel: '', ano: new Date().getFullYear() };
    }
    this.showCursoDialog.set(true);
  }
  closeCursoDialog(): void { this.showCursoDialog.set(false); this.editingCurso.set(null); }
  saveCurso(): void {
    const curso = this.editingCurso();
    const dataToSend = { nombre: this.cursoForm.nombre, nivel: this.cursoForm.nivel, ano: this.cursoForm.ano || new Date().getFullYear() };
    if (curso?.id) {
      this.data.updateCurso(curso.id, dataToSend).subscribe({
        next: () => { this.showMessage('Curso actualizado correctamente'); this.data.loadCursos(); this.closeCursoDialog(); },
        error: () => this.showMessage('Error al actualizar curso')
      });
    } else {
      this.data.createCurso(dataToSend).subscribe({
        next: () => { this.showMessage('Curso creado correctamente'); this.data.loadCursos(); this.closeCursoDialog(); },
        error: () => this.showMessage('Error al crear curso')
      });
    }
  }
  deleteCursoFromChild(curso: Curso): void {
    if (confirm(`¿Estás seguro de eliminar el curso ${curso.nombre}?`)) {
      if (curso.id) {
        this.data.deleteCurso(curso.id).subscribe({
          next: () => { this.showMessage('Curso eliminado correctamente'); this.data.loadCursos(); },
          error: () => this.showMessage('Error al eliminar curso')
        });
      }
    }
  }

  // ===== RECORDATORIO Dialog =====
  openRecordatorioDialog(): void {
    this.recordatorioForm = { titulo: '', descripcion: '', fecha_limite: '' };
    this.showRecordatorioDialog.set(true);
  }
  closeRecordatorioDialog(): void { this.showRecordatorioDialog.set(false); }
  saveRecordatorio(): void {
    if (!this.recordatorioForm.titulo) { this.showMessage('Ingrese un título'); return; }
    const userId = this.auth.user()?.id || (this.auth.user() as any)?._id;
    if (!userId) return;
    this.saving.set(true);
    this.data.createRecordatorio({
      usuario_id: userId, titulo: this.recordatorioForm.titulo,
      descripcion: this.recordatorioForm.descripcion || '',
      fecha_limite: this.data.normalizeDate(this.recordatorioForm.fecha_limite),
      completada: false
    }).subscribe({
      next: () => { this.saving.set(false); this.showMessage('Recordatorio creado'); this.closeRecordatorioDialog(); this.data.loadRecordatorios(); },
      error: () => { this.saving.set(false); this.showMessage('Error al crear recordatorio'); }
    });
  }
  toggleRecordatorioCompleted(rec: Recordatorio): void {
    if (rec.id) {
      this.data.updateRecordatorio(rec.id, { completada: !rec.completada }).subscribe({
        next: () => this.data.loadRecordatorios(), error: () => this.showMessage('Error')
      });
    }
  }
  deleteRecordatorioFromChild(rec: Recordatorio): void {
    if (rec.id && confirm('¿Eliminar?')) {
      this.data.deleteRecordatorio(rec.id).subscribe({
        next: () => { this.showMessage('Eliminado'); this.data.loadRecordatorios(); },
        error: () => this.showMessage('Error')
      });
    }
  }

  // ===== ASIGNACION DOCENTE Dialog =====
  openAsignacionDocenteDialog(): void {
    this.asignacionDocenteForm = { docente_id: '', curso_id: '', asignatura: '' };
    this.showAsignacionDocenteDialog.set(true);
  }
  closeAsignacionDocenteDialog(): void { this.showAsignacionDocenteDialog.set(false); }
  saveAsignacionDocente(): void {
    if (!this.asignacionDocenteForm.docente_id || !this.asignacionDocenteForm.curso_id || !this.asignacionDocenteForm.asignatura) {
      this.showMessage('Complete todos los campos'); return;
    }
    this.saving.set(true);
    this.data.createAsignacionDocente(this.asignacionDocenteForm).subscribe({
      next: () => { this.saving.set(false); this.showMessage('Asignación creada'); this.closeAsignacionDocenteDialog(); this.data.loadAsignacionesDocente(); },
      error: (err) => { this.saving.set(false); this.showMessage(err.error ? JSON.stringify(err.error) : 'Error al crear asignación'); }
    });
  }
  deleteAsignacionFromChild(asig: { id: string }): void {
    if (asig.id && confirm('¿Eliminar esta asignación?')) {
      this.data.deleteAsignacionDocente(asig.id).subscribe({
        next: () => { this.showMessage('Asignación eliminada'); this.data.loadAsignacionesDocente(); },
        error: () => this.showMessage('Error')
      });
    }
  }

  showMessage(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
