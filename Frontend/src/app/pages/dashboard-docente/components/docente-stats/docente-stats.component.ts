import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoAsignado } from '../../services/docente-data.service';
import { DocenteDataService } from '../../services/docente-data.service';

@Component({
  selector: 'app-docente-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente-stats.component.html',
  styleUrls: ['./docente-stats.component.css']
})
export class DocenteStatsComponent {
  readonly data = inject(DocenteDataService);
  selectCurso = output<void>();
}
