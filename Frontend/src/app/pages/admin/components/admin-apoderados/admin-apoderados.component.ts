import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { Usuario } from '../../../../shared/models';

@Component({
  selector: 'app-admin-apoderados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-apoderados.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-apoderados.component.css']
})
export class AdminApoderadosComponent {
  readonly data = inject(AdminDataService);

  createUser = output<void>();
  editUser = output<Usuario>();
  deleteUser = output<Usuario>();

  searchTerm = '';

  get filteredApoderados(): Usuario[] {
    const term = this.searchTerm.toLowerCase();
    return this.data.getApoderadosConUsuario().filter(u => {
      return !term || u.nombre?.toLowerCase().includes(term) || u.apellido?.toLowerCase().includes(term) || u.rut?.toLowerCase().includes(term);
    });
  }
}
