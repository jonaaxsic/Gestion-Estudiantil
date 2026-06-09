import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteDataService } from '../../services/docente-data.service';
import { ApiService } from '../../../../core/services/api.service';
import { Estudiante } from '../../../../shared/models';

@Component({
  selector: 'app-docente-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-asistencia.component.html',
  styleUrls: ['./docente-asistencia.component.css']
})
export class DocenteAsistenciaComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly data = inject(DocenteDataService);

  fechaSeleccionada = this.formatDateLocal(new Date());
  saving = signal(false);
  successMessage = signal('');
  verAsistenciaCursoId = signal('');
  asistenciaDelCurso = signal<any[]>([]);
  asistenciaHoy: Record<string, boolean> = {};
  estudiantesDelCurso = signal<Estudiante[]>([]);

  ngOnInit(): void {
    this.data.loadEstudiantesIfNeeded();
  }

  onVerAsistenciaCurso(event: Event): void {
    const cursoId = (event.target as HTMLSelectElement).value;
    this.verAsistenciaCursoId.set(cursoId);
    if (cursoId) {
      this.api.getEstudiantes(cursoId).subscribe(data => {
        this.estudiantesDelCurso.set(data);
        this.loadAsistenciaCurso(cursoId);
      });
    } else {
      this.estudiantesDelCurso.set([]);
      this.asistenciaDelCurso.set([]);
    }
  }

  loadAsistenciaCurso(cursoId: string): void {
    this.asistenciaHoy = {};
    this.estudiantesDelCurso().forEach(est => { if (est.id) this.asistenciaHoy[est.id] = true; });
    this.api.getAsistencia({ curso_id: cursoId, fecha: this.fechaSeleccionada }).subscribe(data => {
      if (data?.length) data.forEach((a: any) => { if (a.estudiante_id) this.asistenciaHoy[a.estudiante_id] = a.presente ?? true; });
    });
  }

  toggleAsistenciaEstudiante(estudianteId: string): void {
    this.asistenciaHoy[estudianteId] = !this.asistenciaHoy[estudianteId];
  }

  guardarAsistencia(): void {
    const cursoId = this.verAsistenciaCursoId();
    if (!cursoId) { alert('Seleccione un curso'); return; }
    const registros = this.estudiantesDelCurso().filter(e => e.id).map(e => ({ estudiante_id: e.id!, presente: this.asistenciaHoy[e.id!] ?? true }));
    this.saving.set(true);
    this.api.createAsistenciaBulk({ curso_id: cursoId, fecha: this.fechaSeleccionada, registros }).subscribe({
      next: () => { this.saving.set(false); this.successMessage.set('Asistencia guardada'); setTimeout(() => this.successMessage.set(''), 3000); this.loadAsistenciaCurso(cursoId); },
      error: () => { this.saving.set(false); alert('Error al guardar asistencia'); }
    });
  }

  onFechaChange(event: Event): void {
    this.fechaSeleccionada = (event.target as HTMLInputElement).value;
    if (this.verAsistenciaCursoId()) this.loadAsistenciaCurso(this.verAsistenciaCursoId());
  }

  getEstudianteNombre(estudianteId: string): string {
    const est = this.estudiantesDelCurso().find(e => e.id === estudianteId);
    return est ? `${est.apellido} ${est.nombre}` : 'Estudiante';
  }

  getEstudianteRut(estudianteId: string): string {
    const est = this.estudiantesDelCurso().find(e => e.id === estudianteId);
    return est?.rut || '';
  }

  formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getEstadisticas(): { presentes: number; ausentes: number; porcentaje: number } {
    const total = this.estudiantesDelCurso().length;
    const presentes = Object.values(this.asistenciaHoy).filter(v => v).length;
    const ausentes = total - presentes;
    return { presentes, ausentes, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0 };
  }
}
