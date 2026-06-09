import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Curso, Estudiante, Evaluacion, Anotacion, Reunione, Recordatorio, AsignacionDocente, Nota } from '../../../shared/models';

export interface CursoAsignado extends Curso {
  asignatura?: string;
  asignacion_id?: string;
}

@Injectable({ providedIn: 'root' })
export class DocenteDataService {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  // ── State ──
  readonly cursosAsignados = signal<CursoAsignado[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly evaluaciones = signal<Evaluacion[]>([]);
  readonly anotaciones = signal<Anotacion[]>([]);
  readonly reuniones = signal<Reunione[]>([]);
  readonly recordatorios = signal<Recordatorio[]>([]);
  readonly asignacionesDocente = signal<AsignacionDocente[]>([]);
  readonly notasEstudiantes = signal<Nota[]>([]);
  readonly renderTick = signal(0);
  readonly saving = signal(false);

  // ── Data Loading ──
  loadData(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.api.getDashboardDocente(userId).subscribe({
      next: (dashboard) => {
        if (dashboard.cursos) {
          const mapped = dashboard.cursos.map((c: any) => ({
            id: c.id, nombre: c.nombre,
            nivel: c.nombre.split(' ')[0] || '',
            asignatura: c.asignatura
          }));
          this.cursos.set(mapped);
          this.cursosAsignados.set(mapped);
        }
        if (dashboard.recordatorios) {
          this.recordatorios.set(dashboard.recordatorios);
        }
      },
      error: () => this.loadDataFallback()
    });

    this.api.getReuniones().subscribe(data => this.reuniones.set(data));
  }

  private loadDataFallback(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.api.getAsignacionesDocente(userId).subscribe(data => {
      this.asignacionesDocente.set(data);
      this.buildCursosAsignados();
    });
    this.api.getRecordatorios(userId).subscribe(data => this.recordatorios.set(data));
  }

  private buildCursosAsignados(): void {
    const docenteId = this.auth.user()?.id;
    if (!docenteId) return;
    const misAsig = this.asignacionesDocente().filter(a => a.docente_id === docenteId);
    const cursos: CursoAsignado[] = [];
    const seen = new Set<string>();
    for (const asig of misAsig) {
      if (seen.has(asig.curso_id!)) continue;
      const curso = this.cursos().find(c => c.id === asig.curso_id);
      if (curso) {
        cursos.push({ ...curso, asignatura: asig.asignatura, asignacion_id: asig.id });
        seen.add(asig.curso_id!);
      }
    }
    this.cursosAsignados.set(cursos);
  }

  // ── Lazy Loaders ──
  loadEstudiantesIfNeeded(): void {
    if (this.estudiantes().length > 0) return;
    const ids = this.cursosAsignados().map(c => c.id).filter(Boolean);
    ids.forEach(cursoId => {
      this.api.getEstudiantes(cursoId!).subscribe(data => {
        const current = this.estudiantes();
        const merged = data.filter(e => !current.some(x => x.id === e.id));
        this.estudiantes.set([...current, ...merged]);
      });
    });
  }

  loadEstudiantesByCurso(cursoId: string): void {
    this.api.getEstudiantes(cursoId).subscribe(data => this.estudiantes.set(data));
  }

  loadEvaluacionesIfNeeded(): void {
    if (this.evaluaciones().length > 0) return;
    const ids = this.cursosAsignados().map(c => c.id).filter(Boolean);
    if (!ids.length) { this.evaluaciones.set([]); return; }
    this.evaluaciones.set([]);
    ids.forEach(cursoId => {
      this.api.getEvaluaciones(cursoId!).subscribe(data => {
        const current = this.evaluaciones();
        const merged = data.filter(e => !current.some(x => x.id === e.id));
        this.evaluaciones.set([...current, ...merged]);
      });
    });
  }

  loadAnotacionesIfNeeded(): void {
    if (this.anotaciones().length > 0) return;
    const cursoIds = this.cursosAsignados().map(c => c.id).filter(Boolean);
    if (!cursoIds.length) { this.anotaciones.set([]); return; }
    const estIds = this.estudiantes()
      .filter(e => e.curso_id && cursoIds.includes(e.curso_id))
      .map(e => e.id).filter(Boolean);
    if (!estIds.length) { this.anotaciones.set([]); return; }
    this.anotaciones.set([]);
    estIds.forEach(estId => {
      this.api.getAnotaciones(estId!).subscribe(data => {
        const current = this.anotaciones();
        const merged = data.filter(a => !current.some(x => x.id === a.id));
        this.anotaciones.set([...current, ...merged]);
      });
    });
  }

  loadReunionesIfNeeded(): void {
    if (this.reuniones().length > 0) return;
    const ids = this.cursosAsignados().map(c => c.id).filter(Boolean);
    if (!ids.length) { this.reuniones.set([]); return; }
    this.reuniones.set([]);
    ids.forEach(cursoId => {
      this.api.getReuniones(cursoId!).subscribe(data => {
        const current = this.reuniones();
        const merged = data.filter(r => !current.some(x => x.id === r.id));
        this.reuniones.set([...current, ...merged]);
      });
    });
  }

  // ── Helpers ──
  getCursoNombre(cursoId: string): string {
    const curso = this.cursos().find(c => c.id === cursoId);
    return curso ? `${curso.nivel} ${curso.nombre}` : 'Curso';
  }

  getNombreLimpio(curso: { nombre: string; nivel?: string }): string {
    if (curso.nivel && curso.nombre.startsWith(curso.nivel)) {
      return curso.nombre.substring(curso.nivel.length).trim();
    }
    return curso.nombre;
  }

  getEstudianteNombre(estudianteId?: string): string {
    if (!estudianteId) return 'Estudiante desconocido';
    const est = this.estudiantes().find(e => e.id === estudianteId);
    return est ? `${est.apellido} ${est.nombre}` : 'Estudiante #' + estudianteId.substring(0, 8);
  }

  formatFecha(isoDate: string | undefined): string {
    if (!isoDate) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(isoDate)) return isoDate;
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return isoDate;
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
}
