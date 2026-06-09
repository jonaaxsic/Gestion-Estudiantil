import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteDataService } from '../../services/docente-data.service';
import { ApiService } from '../../../../core/services/api.service';
import { Evaluacion } from '../../../../shared/models';

@Component({
  selector: 'app-docente-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-evaluaciones.component.html',
  styleUrls: ['./docente-evaluaciones.component.css']
})
export class DocenteEvaluacionesComponent {
  private readonly api = inject(ApiService);
  readonly data = inject(DocenteDataService);

  showModal = signal(false);
  showEditModal = signal(false);
  selectedEvaluacion = signal<Evaluacion | null>(null);
  saving = signal(false);

  form = { cursoId: '', materia: '', titulo: '', descripcion: '', fecha: '', ponderacion: 20 };

  openCreateDialog(): void {
    this.form = { cursoId: '', materia: '', titulo: '', descripcion: '', fecha: '', ponderacion: 20 };
    this.selectedEvaluacion.set(null);
    this.showModal.set(true);
  }

  openEditDialog(evaluacion: Evaluacion): void {
    this.form = {
      cursoId: evaluacion.curso_id || '', materia: evaluacion.materia || '',
      titulo: evaluacion.titulo || '', descripcion: evaluacion.descripcion || '',
      fecha: evaluacion.fecha || '', ponderacion: evaluacion.ponderacion || 20
    };
    this.selectedEvaluacion.set(evaluacion);
    this.showEditModal.set(true);
  }

  closeModals(): void { this.showModal.set(false); this.showEditModal.set(false); this.selectedEvaluacion.set(null); }

  save(): void {
    if (!this.form.cursoId || !this.form.materia || !this.form.titulo || !this.form.fecha) {
      alert('Complete todos los campos requeridos'); return;
    }
    this.saving.set(true);
    this.api.createEvaluacion({
      curso_id: this.form.cursoId, materia: this.form.materia, titulo: this.form.titulo,
      descripcion: this.form.descripcion, fecha: this.form.fecha, ponderacion: this.form.ponderacion
    }).subscribe({
      next: () => { this.saving.set(false); this.closeModals(); this.data.loadData(); },
      error: () => { this.saving.set(false); alert('Error al crear evaluación'); }
    });
  }

  update(): void {
    const eval_ = this.selectedEvaluacion();
    if (!eval_?.id) return;
    this.saving.set(true);
    this.api.updateEvaluacion(eval_.id, {
      curso_id: this.form.cursoId, materia: this.form.materia, titulo: this.form.titulo,
      descripcion: this.form.descripcion, fecha: this.form.fecha, ponderacion: this.form.ponderacion
    }).subscribe({
      next: () => { this.saving.set(false); this.closeModals(); this.data.loadData(); },
      error: () => { this.saving.set(false); alert('Error al actualizar'); }
    });
  }

  delete(evaluacion: Evaluacion): void {
    if (evaluacion.id && confirm('¿Eliminar esta evaluación?')) {
      this.api.deleteEvaluacion(evaluacion.id).subscribe({ next: () => this.data.loadData(), error: () => alert('Error') });
    }
  }

  getEvaluacionesDelCurso(): Evaluacion[] {
    const cursoId = this.data.cursosAsignados()[0]?.id;
    return cursoId ? this.data.evaluaciones().filter(e => e.curso_id === cursoId) : [];
  }
}
