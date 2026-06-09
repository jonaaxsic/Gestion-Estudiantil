import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { AsignacionDocente } from '../../../../shared/models';

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-docentes.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-docentes.component.css']
})
export class AdminDocentesComponent {
  readonly data = inject(AdminDataService);

  createAsignacion = output<void>();
  deleteAsignacion = output<{ id: string }>();

  searchQuery = signal('');

  getDocentesFiltrados() {
    const q = this.searchQuery().toLowerCase().trim();
    const todos = this.data.getDocentesConAsignaciones();
    if (!q) return todos;
    return todos.filter(d =>
      d.nombre.toLowerCase().includes(q) ||
      d.cursos.some(c => c.curso.toLowerCase().includes(q) || c.asignatura.toLowerCase().includes(q))
    );
  }
}
