import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario, Estudiante, Curso, Recordatorio, AsignacionDocente } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  // Data
  readonly usuarios = signal<Usuario[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly recordatorios = signal<Recordatorio[]>([]);
  readonly asignacionesDocente = signal<AsignacionDocente[]>([]);

  // ===== Load =====
  loadAll(): void {
    this.loadUsuarios();
    this.loadEstudiantes();
    this.loadCursos();
    this.loadRecordatorios();
    this.loadAsignacionesDocente();
  }

  loadUsuarios(): void {
    this.api.getUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => {}
    });
  }

  loadEstudiantes(): void {
    this.api.getEstudiantes().subscribe({
      next: (data) => this.estudiantes.set(data),
      error: () => {}
    });
  }

  loadCursos(): void {
    this.api.getCursos().subscribe({
      next: (data) => this.cursos.set(data),
      error: () => {}
    });
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

  // ===== CRUD Usuários =====
  createUsuario(data: Partial<Usuario>) {
    return this.api.createUsuario(data);
  }

  updateUsuario(id: string, data: Partial<Usuario>) {
    return this.api.updateUsuario(id, data);
  }

  deleteUsuario(id: string) {
    return this.api.deleteUsuario(id);
  }

  // ===== CRUD Estudiantes =====
  createEstudiante(data: Partial<Estudiante>) {
    return this.api.createEstudiante(data);
  }

  updateEstudiante(id: string, data: Partial<Estudiante>) {
    return this.api.updateEstudiante(id, data);
  }

  deleteEstudiante(id: string) {
    return this.api.deleteEstudiante(id);
  }

  // ===== CRUD Cursos =====
  createCurso(data: Partial<Curso>) {
    return this.api.createCurso(data);
  }

  updateCurso(id: string, data: Partial<Curso>) {
    return this.api.updateCurso(id, data);
  }

  deleteCurso(id: string) {
    return this.api.deleteCurso(id);
  }

  // ===== CRUD Recordatorios =====
  createRecordatorio(data: Partial<Recordatorio>) {
    return this.api.createRecordatorio(data);
  }

  updateRecordatorio(id: string, data: Partial<Recordatorio>) {
    return this.api.updateRecordatorio(id, data);
  }

  deleteRecordatorio(id: string) {
    return this.api.deleteRecordatorio(id);
  }

  // ===== CRUD Asignaciones Docente =====
  createAsignacionDocente(data: { docente_id: string; curso_id: string; asignatura: string }) {
    return this.api.createAsignacionDocente(data);
  }

  deleteAsignacionDocente(id: string) {
    return this.api.deleteAsignacionDocente(id);
  }

  // ===== Helpers =====
  getCountByRole(rol: string): number {
    return this.usuarios().filter(u => u.rol === rol).length;
  }

  getEstudiantesConApoderado(): number {
    return this.estudiantes().filter(e => e.apoderado_id).length;
  }

  getEstudiantesSinApoderado(): Estudiante[] {
    return this.estudiantes().filter(e => !e.apoderado_id);
  }

  getEstudiantesCount(cursoId: string | undefined): number {
    if (!cursoId) return 0;
    return this.estudiantes().filter(e => e.curso_id === cursoId).length;
  }

  getCursoNombreDisplay(cursoId: string | undefined): string {
    if (!cursoId) return 'Sin curso';
    const curso = this.cursos().find(c => c.id === cursoId);
    if (!curso) return 'Sin curso';
    return `${curso.nombre} - ${curso.nivel}`;
  }

  getDocenteNombre(docenteId: string): string {
    const docente = this.usuarios().find(u => u.id === docenteId);
    return docente ? `${docente.nombre} ${docente.apellido}` : 'Docente';
  }

  getDocentes(): Usuario[] {
    return this.usuarios().filter(u => u.rol === 'docente');
  }

  getApoderadosConUsuario(): Usuario[] {
    return this.usuarios().filter(u => u.rol === 'apoderado');
  }

  getPupiloNombre(apoderadoId: string): string {
    const estudiante = this.estudiantes().find(e => e.apoderado_id === apoderadoId);
    return estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Sin pupilo';
  }

  getDocentesConAsignaciones() {
    const mapa = new Map<string, {
      docente_id: string;
      nombre: string;
      inicial: string;
      cursos: Array<{ asignacion_id: string; curso: string; asignatura: string }>;
    }>();

    for (const asig of this.asignacionesDocente()) {
      if (!asig.docente_id) continue;
      if (!mapa.has(asig.docente_id)) {
        const nombre = this.getDocenteNombre(asig.docente_id);
        mapa.set(asig.docente_id, {
          docente_id: asig.docente_id,
          nombre,
          inicial: nombre.charAt(0).toUpperCase(),
          cursos: []
        });
      }
      mapa.get(asig.docente_id)!.cursos.push({
        asignacion_id: asig.id || '',
        curso: this.getCursoNombreDisplay(asig.curso_id),
        asignatura: asig.asignatura || ''
      });
    }

    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  normalizeDate(dateStr: string | undefined): string | undefined {
    if (!dateStr) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-');
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  }

  formatFecha(isoDate: string | undefined): string {
    if (!isoDate) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(isoDate)) return isoDate;
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return isoDate;
  }
}
