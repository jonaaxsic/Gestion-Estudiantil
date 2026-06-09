import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../../services/admin-data.service';
import { Recordatorio } from '../../../../shared/models';

@Component({
  selector: 'app-admin-recordatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-recordatorios.component.html',
  styleUrls: ['../../_admin-shared-ui.css', '../../_admin-shared-docentes.css', '../../_admin-shared-responsive.css', './admin-recordatorios.component.css']
})
export class AdminRecordatoriosComponent {
  readonly data = inject(AdminDataService);

  createRecordatorio = output<void>();
  toggleCompleted = output<Recordatorio>();
  deleteRecordatorio = output<Recordatorio>();
}
