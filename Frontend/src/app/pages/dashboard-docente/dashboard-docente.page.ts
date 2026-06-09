import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteDataService, CursoAsignado } from './services/docente-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SharedTabsComponent, SharedHeaderComponent, TabItem, SettingsPanelComponent } from '../../shared/components';

import { DocenteStatsComponent } from './components/docente-stats/docente-stats.component';
import { DocenteCursosComponent } from './components/docente-cursos/docente-cursos.component';
import { DocenteNotasComponent } from './components/docente-notas/docente-notas.component';
import { DocenteAsistenciaComponent } from './components/docente-asistencia/docente-asistencia.component';
import { DocenteEvaluacionesComponent } from './components/docente-evaluaciones/docente-evaluaciones.component';
import { DocenteAnotacionesComponent } from './components/docente-anotaciones/docente-anotaciones.component';
import { DocenteReunionesComponent } from './components/docente-reuniones/docente-reuniones.component';

@Component({
  selector: 'app-dashboard-docente',
  standalone: true,
  imports: [
    CommonModule,
    SharedTabsComponent,
    SharedHeaderComponent,
    SettingsPanelComponent,
    DocenteStatsComponent,
    DocenteCursosComponent,
    DocenteNotasComponent,
    DocenteAsistenciaComponent,
    DocenteEvaluacionesComponent,
    DocenteAnotacionesComponent,
    DocenteReunionesComponent,
  ],
  templateUrl: './dashboard-docente.page.html',
  styleUrls: ['./dashboard-docente.page.css']
})
export class DashboardDocentePage implements OnInit {
  readonly data = inject(DocenteDataService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  activeView = signal<'dashboard' | 'cursos' | 'notas' | 'asistencia' | 'evaluaciones' | 'anotaciones' | 'reuniones' | 'configuracion'>('dashboard');
  showMobileMenu = signal(false);
  selectedCurso = signal<CursoAsignado | null>(null);
  selectedAsignatura = signal('');
  studentSearchQuery = signal('');
  cursoTab = signal<'notas' | 'asistencia' | 'reuniones' | 'anotaciones' | 'evaluaciones'>('notas');

  readonly tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'cursos', label: 'Cursos', icon: 'class' },
    { id: 'asistencia', label: 'Asistencia', icon: 'how_to_reg' },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: 'assignment' },
    { id: 'anotaciones', label: 'Anotaciones', icon: 'note_add' },
    { id: 'reuniones', label: 'Reuniones', icon: 'event' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' }
  ];

  get tabIndex(): number {
    return this.tabs.findIndex(t => t.id === this.activeView());
  }

  ngOnInit(): void {
    this.data.loadData();
  }

  onTabChanged(tabId: string): void {
    this.activeView.set(tabId as any);
    if (tabId === 'asistencia') this.data.loadEstudiantesIfNeeded();
    else if (tabId === 'evaluaciones') this.data.loadEvaluacionesIfNeeded();
    else if (tabId === 'anotaciones') this.data.loadAnotacionesIfNeeded();
    else if (tabId === 'reuniones') this.data.loadReunionesIfNeeded();
  }

  setView(view: string): void {
    this.activeView.set(view as any);
    this.closeMobileMenu();
  }

  seleccionarCurso(curso: CursoAsignado): void {
    this.selectedCurso.set(curso);
    this.selectedAsignatura.set(curso.asignatura || '');
    this.data.loadEstudiantesByCurso(curso.id!);
    this.activeView.set('notas');
  }

  toggleMobileMenu(): void { this.showMobileMenu.update(v => !v); }
  closeMobileMenu(): void { this.showMobileMenu.set(false); }
  logout(): void { this.auth.logout(); }

  onSaved(msg: string): void { console.log('Saved:', msg); }
  onError(msg: string): void { console.error('Error:', msg); }
  onRefresh(): void { if (this.selectedCurso()) this.data.loadEstudiantesByCurso(this.selectedCurso()!.id!); }
}
