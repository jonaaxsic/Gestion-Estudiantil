import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { Usuario } from '../../../../shared/models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-usuarios.component.css']
})
export class AdminUsuariosComponent {
  readonly data = inject(AdminDataService);

  createUser = output<void>();
  editUser = output<Usuario>();
  deleteUser = output<Usuario>();

  rolFilter = '';

  get filteredUsuarios(): Usuario[] {
    const rol = this.rolFilter;
    return this.data.usuarios().filter(u => !rol || u.rol === rol);
  }
}
