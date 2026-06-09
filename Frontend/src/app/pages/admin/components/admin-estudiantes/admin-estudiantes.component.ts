import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../../services/admin-data.service';
import { Estudiante } from '../../../../shared/models';

@Component({
  selector: 'app-admin-estudiantes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-estudiantes.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-estudiantes.component.css']
})
export class AdminEstudiantesComponent {
  readonly data = inject(AdminDataService);

  createStudent = output<void>();
  editStudent = output<Estudiante>();
  deleteStudent = output<Estudiante>();
}
