import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoAsignado } from '../../services/docente-data.service';
import { DocenteDataService } from '../../services/docente-data.service';
import { Curso } from '../../../../shared/models';

@Component({
  selector: 'app-docente-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente-cursos.component.html',
  styleUrls: ['./docente-cursos.component.css']
})
export class DocenteCursosComponent {
  readonly data = inject(DocenteDataService);
  seleccionarCurso = output<CursoAsignado>();
}
