import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../../services/admin-data.service';
import { Curso } from '../../../../shared/models';

@Component({
  selector: 'app-admin-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-cursos.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-cursos.component.css']
})
export class AdminCursosComponent {
  readonly data = inject(AdminDataService);

  createCurso = output<void>();
  editCurso = output<Curso>();
  deleteCurso = output<Curso>();
}
