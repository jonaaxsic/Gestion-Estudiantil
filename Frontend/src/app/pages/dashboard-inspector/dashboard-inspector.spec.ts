import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DashboardInspectorPage } from './dashboard-inspector.page';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { of } from 'rxjs';
import { Estudiante, Curso } from '../../shared/models';

describe('DashboardInspectorPage', () => {
  let mockApi: jasmine.SpyObj<ApiService>;
  let mockAuth: Partial<AuthService>;
  let mockTheme: Partial<ThemeService>;

  beforeEach(async () => {
    // Mock solo lo que el componente usa realmente
    mockApi = jasmine.createSpyObj('ApiService', [
      'getCursos',
      'getDashboardInspector',
      'getEstudiantes',
      'getCurso',
    ]);
    mockApi.getCursos.and.returnValue(of([]));
    mockApi.getDashboardInspector.and.returnValue(of({} as any));
    mockApi.getEstudiantes.and.returnValue(of([]));

    // AuthService mock: user tiene id
    mockAuth = {
      user: signal({ id: 'test-inspector-id', nombre: 'Eduardo', rol: 'inspector_general' } as any),
      logout: jasmine.createSpy('logout'),
    };

    mockTheme = {
      theme: signal('light'),
      isDark: () => false,
      toggle: jasmine.createSpy('toggle'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardInspectorPage],
      providers: [
        { provide: ApiService, useValue: mockApi },
        { provide: AuthService, useValue: mockAuth },
        { provide: ThemeService, useValue: mockTheme },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DashboardInspectorPage);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should start with dashboard view', () => {
    const fixture = TestBed.createComponent(DashboardInspectorPage);
    const component = fixture.componentInstance;
    expect(component.activeView()).toBe('dashboard');
  });

  it('should have exactly 6 tabs for inspector', () => {
    const fixture = TestBed.createComponent(DashboardInspectorPage);
    const component = fixture.componentInstance;
    expect(component.inspectorTabs.length).toBe(6);
    expect(component.inspectorTabs.map(t => t.id)).toEqual([
      'dashboard', 'documentos', 'retiros', 'accidentes', 'asistencia', 'libro',
    ]);
  });

  it('should load cursos and dashboard on init', () => {
    const fixture = TestBed.createComponent(DashboardInspectorPage);
    fixture.detectChanges(); // triggers ngOnInit
    expect(mockApi.getCursos).toHaveBeenCalled();
    expect(mockApi.getDashboardInspector).toHaveBeenCalledWith('test-inspector-id');
  });

  describe('tab switching', () => {
    it('should switch views via onTabChanged', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.onTabChanged('documentos');
      expect(component.activeView()).toBe('documentos');
    });

    it('should load retiros when switching to retiros tab', () => {
      mockApi.getRetiros = jasmine.createSpy('getRetiros').and.returnValue(of([]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.onTabChanged('retiros');
      expect(mockApi.getRetiros).toHaveBeenCalled();
    });

    it('should load accidentes when switching to accidentes tab', () => {
      mockApi.getAccidentes = jasmine.createSpy('getAccidentes').and.returnValue(of([]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.onTabChanged('accidentes');
      expect(mockApi.getAccidentes).toHaveBeenCalled();
    });
  });

  describe('getTipoIcon', () => {
    it('should return correct icons for each tipo', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      expect(component.getTipoIcon('llegada_tarde')).toBe('schedule');
      expect(component.getTipoIcon('sin_materiales')).toBe('bookmark_border');
      expect(component.getTipoIcon('conducta')).toBe('warning');
      expect(component.getTipoIcon('comunicado')).toBe('campaign');
      expect(component.getTipoIcon('otro')).toBe('more_horiz');
    });

    it('should return more_horiz for unknown tipo', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      expect(component.getTipoIcon('inexistente')).toBe('more_horiz');
    });
  });

  describe('getTipoLabel', () => {
    it('should return correct labels for each tipo', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      expect(component.getTipoLabel('llegada_tarde')).toBe('Llegada Tarde');
      expect(component.getTipoLabel('sin_materiales')).toBe('Sin Materiales');
      expect(component.getTipoLabel('conducta')).toBe('Conducta');
      expect(component.getTipoLabel('comunicado')).toBe('Comunicado');
      expect(component.getTipoLabel('otro')).toBe('Otro');
    });

    it('should return the tipo itself if no label exists', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      expect(component.getTipoLabel('no_existe')).toBe('no_existe');
    });
  });

  describe('getCursoNombre', () => {
    it('should return formatted course name when id matches', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.cursos.set([
        { id: 'curso-1', nivel: '1°', nombre: 'Basico A' } as Curso,
      ]);
      expect(component.getCursoNombre('curso-1')).toBe('1° Basico A');
    });

    it('should return "Curso desconocido" when id not found', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.cursos.set([]);
      expect(component.getCursoNombre('no-existe')).toBe('Curso desconocido');
    });
  });

  describe('getAsistenciaStats', () => {
    it('should calculate stats correctly', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.asistenciaGeneral = [
        { curso_id: 'curso-1', presente: true } as any,
        { curso_id: 'curso-1', presente: false } as any,
        { curso_id: 'curso-1', presente: true } as any,
        { curso_id: 'curso-2', presente: true } as any,
      ];
      const stats = component.getAsistenciaStats('curso-1');
      expect(stats.total).toBe(3);
      expect(stats.presentes).toBe(2);
      expect(stats.ausentes).toBe(1);
    });

    it('should return zeros when curso has no asistencia', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.asistenciaGeneral = [];
      const stats = component.getAsistenciaStats('curso-1');
      expect(stats.total).toBe(0);
      expect(stats.presentes).toBe(0);
      expect(stats.ausentes).toBe(0);
    });
  });

  describe('showSuccess', () => {
    it('should set and clear success message after timeout', () => {
      jasmine.clock().install();
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.showSuccess('PDF generado');
      expect(component.successMessage()).toBe('PDF generado');
      jasmine.clock().tick(3000);
      expect(component.successMessage()).toBe('');
      jasmine.clock().uninstall();
    });
  });

  describe('closePdfPreview', () => {
    it('should clear pdf preview data', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.pdfPreviewData.set('base64-data-here');
      component.showPdfPreview.set(true);
      component.closePdfPreview();
      expect(component.showPdfPreview()).toBe(false);
      expect(component.pdfPreviewData()).toBe('');
    });
  });

  describe('buscarEstudiante', () => {
    it('should search by nombre', () => {
      mockApi.getEstudiantes.and.returnValue(of([
        { id: '1', nombre: 'Diego', apellido: 'Rodriguez', rut: '24.623.073-0' } as Estudiante,
        { id: '2', nombre: 'Ana', apellido: 'Lopez', rut: '11.111.111-1' } as Estudiante,
      ]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.buscarEstudiante('Diego');
      expect(component.estudiantes().length).toBe(1);
      expect(component.estudiantes()[0].nombre).toBe('Diego');
    });

    it('should search by RUT', () => {
      mockApi.getEstudiantes.and.returnValue(of([
        { id: '1', nombre: 'Diego', apellido: 'Rodriguez', rut: '24.623.073-0' } as Estudiante,
      ]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.buscarEstudiante('24.623');
      expect(component.estudiantes().length).toBe(1);
    });

    it('should search by apellido', () => {
      mockApi.getEstudiantes.and.returnValue(of([
        { id: '1', nombre: 'Diego', apellido: 'Rodriguez' } as Estudiante,
        { id: '2', nombre: 'Ana', apellido: 'Lopez' } as Estudiante,
      ]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.buscarEstudiante('lopez');
      expect(component.estudiantes().length).toBe(1);
      expect(component.estudiantes()[0].apellido).toBe('Lopez');
    });

    it('should return empty results if no match', () => {
      mockApi.getEstudiantes.and.returnValue(of([
        { id: '1', nombre: 'Diego', apellido: 'Rodriguez' } as Estudiante,
      ]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.buscarEstudiante('ZZZZZ');
      expect(component.estudiantes().length).toBe(0);
    });

    it('should do nothing with empty query', () => {
      mockApi.getEstudiantes.and.returnValue(of([]));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.buscarEstudiante('');
      expect(mockApi.getEstudiantes).not.toHaveBeenCalled();
      component.buscarEstudiante('   ');
      expect(mockApi.getEstudiantes).toHaveBeenCalledTimes(0);
    });
  });

  describe('seleccionarEstudiante', () => {
    it('should set selected student and load curso', () => {
      mockApi.getCurso.and.returnValue(of({ nivel: '1°', nombre: 'Basico A' } as Curso));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      const est = { id: 'est-1', nombre: 'Diego', apellido: 'Rodriguez', curso_id: 'curso-1' } as Estudiante;
      component.seleccionarEstudiante(est);
      expect(component.selectedEstudiante()).toBeDefined();
      expect(mockApi.getCurso).toHaveBeenCalledWith('curso-1');
    });
  });

  describe('download filename', () => {
    it('should set lastGeneratedDocType when generating certificado regular', () => {
      mockApi.generarCertificadoAlumnoRegular = jasmine.createSpy('generarCertificadoAlumnoRegular').and.returnValue(of({ pdf_base64: '', success: true, message: '' }));
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.selectedEstudiante.set({ id: 'est-1', nombre: 'Diego', apellido: 'Rodriguez' } as any);
      component.generarCertificadoRegular();
      expect(component.lastGeneratedDocType()).toBe('certificado_alumno_regular');
    });

    it('should build filename from student name and doc type', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.selectedEstudiante.set({ nombre: 'Diego', apellido: 'Rodriguez' } as Estudiante);
      component.lastGeneratedDocType.set('certificado_alumno_regular');
      expect(component['DOC_FILENAMES']['certificado_alumno_regular']).toBe('certificado_alumnoregular');
    });

    it('should clear doc type on closePdfPreview', () => {
      const fixture = TestBed.createComponent(DashboardInspectorPage);
      const component = fixture.componentInstance;
      component.lastGeneratedDocType.set('certificado_alumno_regular');
      component.showPdfPreview.set(true);
      component.closePdfPreview();
      expect(component.lastGeneratedDocType()).toBe('');
    });
  });
});
