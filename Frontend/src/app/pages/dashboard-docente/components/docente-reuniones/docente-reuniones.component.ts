import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteDataService } from '../../services/docente-data.service';
import { ApiService } from '../../../../core/services/api.service';
import { Reunione } from '../../../../shared/models';

@Component({
  selector: 'app-docente-reuniones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-reuniones.component.html',
  styleUrls: ['./docente-reuniones.component.css']
})
export class DocenteReunionesComponent {
  private readonly api = inject(ApiService);
  readonly data = inject(DocenteDataService);
  showModal = signal(false);
  saving = signal(false);
  selectedReunion = signal<Reunione | null>(null);
  form = { cursoId: '', fecha: '', hora: '', lugar: '', descripcion: '' };

  openDialog(): void {
    this.selectedReunion.set(null);
    this.form = { cursoId: '', fecha: '', hora: '', lugar: '', descripcion: '' };
    this.showModal.set(true);
  }

  openEditDialog(reunion: Reunione): void {
    this.form = { cursoId: reunion.curso_id || '', fecha: reunion.fecha || '', hora: reunion.hora || '', lugar: reunion.lugar || '', descripcion: reunion.descripcion || '' };
    this.selectedReunion.set(reunion);
    this.showModal.set(true);
  }

  close(): void { this.showModal.set(false); this.selectedReunion.set(null); }

  save(): void {
    if (!this.form.cursoId || !this.form.fecha || !this.form.hora || !this.form.lugar) { alert('Complete todos los campos'); return; }
    this.saving.set(true);
    const data = { curso_id: this.form.cursoId, fecha: this.form.fecha, hora: this.form.hora, lugar: this.form.lugar, descripcion: this.form.descripcion, notificacion_enviada: false };
    const existing = this.selectedReunion();
    const request = existing?.id ? this.api.updateReunion(existing.id, data) : this.api.createReunion(data);
    request.subscribe({
      next: () => { this.saving.set(false); this.close(); this.data.loadData(); },
      error: (err) => { this.saving.set(false); alert('Error: ' + (err?.error?.error || err?.message || 'Desconocido')); }
    });
  }

  delete(reunion: Reunione): void {
    if (reunion.id && confirm('¿Eliminar esta reunión?')) {
      this.api.deleteReunion(reunion.id).subscribe({ next: () => this.data.loadData(), error: () => alert('Error') });
    }
  }

  getReunionesProximas(): Reunione[] {
    const hoy = new Date();
    return this.data.reuniones().filter(r => new Date(r.fecha) >= hoy).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  getReunionesPasadas(): Reunione[] {
    const hoy = new Date();
    return this.data.reuniones().filter(r => new Date(r.fecha) < hoy).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
}
