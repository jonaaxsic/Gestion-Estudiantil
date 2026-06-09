import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteDataService } from '../../services/docente-data.service';
import { ApiService } from '../../../../core/services/api.service';
import { Anotacion } from '../../../../shared/models';

@Component({
  selector: 'app-docente-anotaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-anotaciones.component.html',
  styleUrls: ['./docente-anotaciones.component.css']
})
export class DocenteAnotacionesComponent {
  private readonly api = inject(ApiService);
  readonly data = inject(DocenteDataService);
  showModal = signal(false);
  saving = signal(false);
  form = { estudianteId: '', tipo: 'negativa' as 'positiva' | 'negativa', descripcion: '', fecha: new Date().toISOString().split('T')[0] };

  openDialog(): void {
    this.data.loadEstudiantesIfNeeded();
    this.form = { estudianteId: '', tipo: 'negativa', descripcion: '', fecha: new Date().toISOString().split('T')[0] };
    this.showModal.set(true);
  }

  close(): void { this.showModal.set(false); }

  save(): void {
    if (!this.form.estudianteId || !this.form.descripcion) { alert('Complete todos los campos'); return; }
    this.saving.set(true);
    this.api.createAnotacion({ estudiante_id: this.form.estudianteId, tipo: this.form.tipo, descripcion: this.form.descripcion, fecha: this.form.fecha }).subscribe({
      next: () => { this.saving.set(false); this.close(); this.data.loadData(); },
      error: () => { this.saving.set(false); alert('Error al crear anotación'); }
    });
  }

  delete(anotacion: Anotacion): void {
    if (anotacion.id && confirm('¿Eliminar esta anotación?')) {
      this.api.deleteAnotacion(anotacion.id).subscribe({ next: () => this.data.loadData(), error: () => alert('Error') });
    }
  }

  getAnotacionesDelCurso(): Anotacion[] {
    const cursoId = this.data.cursosAsignados()[0]?.id;
    if (!cursoId) return [];
    const estIds = this.data.estudiantes().filter(e => e.curso_id === cursoId).map(e => e.id);
    return this.data.anotaciones().filter(a => a.estudiante_id && estIds.includes(a.estudiante_id));
  }
}
