import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SharedTabsComponent, SharedHeaderComponent, TabItem } from '../../shared/components';
import {
  Estudiante, Curso, Asistencia,
  DocumentoGenerado, AccidenteEscolar, RetiroAlumno,
  LibroInspectoria, DashboardInspector, InasistenciaCritica,
  PdfResponse,
} from '../../shared/models';

@Component({
  selector: 'app-dashboard-inspector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    SharedTabsComponent,
    SharedHeaderComponent,
  ],
  templateUrl: './dashboard-inspector.page.html',
  styleUrls: ['./dashboard-inspector.page.css'],
})
export class DashboardInspectorPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  // ============ ESTADOS ============
  activeView = signal<'dashboard' | 'documentos' | 'retiros' | 'accidentes' | 'asistencia' | 'libro'>('dashboard');

  // Dashboard data
  dashboardData = signal<DashboardInspector | null>(null);

  // Lists
  estudiantes = signal<Estudiante[]>([]);
  cursos = signal<Curso[]>([]);
  documentos = signal<DocumentoGenerado[]>([]);
  retiros = signal<RetiroAlumno[]>([]);
  accidentes = signal<AccidenteEscolar[]>([]);
  libroRegistros = signal<LibroInspectoria[]>([]);
  inasistenciasCriticas = signal<InasistenciaCritica[]>([]);

  // Modal states
  showBuscarEstudiante = signal(false);
  showCertificadoNotas = signal(false);
  showRetiroModal = signal(false);
  showAccidenteModal = signal(false);
  showLibroModal = signal(false);
  showMobileMenu = signal(false);
  showPdfPreview = signal(false);
  pdfPreviewData = signal<string>('');
  lastGeneratedDocType = signal<string>('');

  // Documento detail modal
  showDocumentoDetail = signal(false);
  selectedDocumento = signal<any>(null);
  documentoEditMode = signal(false);

  // Documento editing (reuse existing modals with preloaded data)
  editingDocumentoId = signal<string | null>(null);

  // Modal student search (shared: only one modal at a time)
  showModalStudentSearch = signal(false);
  modalSearchQuery = signal('');
  modalEstudiantes = signal<Estudiante[]>([]);

  // Confirm modal
  showConfirmModal = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  private pendingConfirmAction: (() => void) | null = null;

  openConfirmModal(title: string, message: string, onConfirm: () => void): void {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.pendingConfirmAction = onConfirm;
    this.showConfirmModal.set(true);
  }

  onConfirmAction(): void {
    this.pendingConfirmAction?.();
    this.pendingConfirmAction = null;
    this.showConfirmModal.set(false);
  }

  onCancelConfirm(): void {
    this.pendingConfirmAction = null;
    this.showConfirmModal.set(false);
  }

  // Selected
  selectedEstudiante = signal<Estudiante | null>(null);
  selectedCursoId = signal<string>('');
  fechaAsistencia = signal<string>(new Date().toISOString().split('T')[0]);

  // Form data
  retiroForm = {
    estudiante_id: '',
    apoderado_autorizante: '',
    motivo: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_salida: '',
    observacion: '',
  };

  accidenteForm = {
    estudiante_id: '',
    fecha_accidente: new Date().toISOString().split('T')[0],
    hora_accidente: '',
    lugar: '',
    descripcion: '',
    tipo_lesion: '',
    testigos: '',
    derivacion: '',
  };

  libroForm = {
    tipo: 'otro' as string,
    estudiante_id: '',
    curso_id: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  };

  saving = signal(false);
  successMessage = signal('');

  // ============ TABS ============
  inspectorTabs: TabItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: 'dashboard' },
    { id: 'documentos', label: 'Documentos', icon: 'description' },
    { id: 'retiros', label: 'Retiros', icon: 'exit_to_app' },
    { id: 'accidentes', label: 'Accidentes', icon: 'local_hospital' },
    { id: 'asistencia', label: 'Asistencia', icon: 'how_to_reg' },
    { id: 'libro', label: 'Libro', icon: 'book' },
  ];

  get tabIndex(): number {
    const tabs = ['dashboard', 'documentos', 'retiros', 'accidentes', 'asistencia', 'libro'];
    return tabs.indexOf(this.activeView());
  }

  set tabIndex(index: number) {
    const views: ('dashboard' | 'documentos' | 'retiros' | 'accidentes' | 'asistencia' | 'libro')[] =
      ['dashboard', 'documentos', 'retiros', 'accidentes', 'asistencia', 'libro'];
    if (index >= 0 && index < views.length) {
      this.activeView.set(views[index]);
    }
  }

  onTabChanged(tabId: string): void {
    this.activeView.set(tabId as any);
    if (tabId === 'retiros') this.loadRetiros();
    if (tabId === 'accidentes') this.loadAccidentes();
    if (tabId === 'asistencia') this.loadAsistenciaData();
    if (tabId === 'libro') this.loadLibro();
  }

  // ============ INIT ============
  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    // Cargar cursos para referencias
    this.api.getCursos().subscribe(data => this.cursos.set(data));

    // Cargar dashboard
    const userId = this.auth.user()?.id;
    if (userId) {
      this.api.getDashboardInspector(userId).subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.inasistenciasCriticas.set(data.inasistencias_criticas || []);
        },
        error: () => console.error('Error al cargar dashboard del inspector'),
      });
    }
  }

  // ============ DOCUMENTOS ============
  buscarEstudiante(rutONombre: string): void {
    if (!rutONombre.trim()) return;
    this.api.getEstudiantes().subscribe(data => {
      const query = rutONombre.toLowerCase();
      const results = data.filter(e =>
        e.rut?.toLowerCase().includes(query) ||
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(query) ||
        e.nombre?.toLowerCase().includes(query) ||
        e.apellido?.toLowerCase().includes(query)
      );
      this.estudiantes.set(results);
      this.showBuscarEstudiante.set(results.length > 0);
    });
  }

  seleccionarEstudiante(est: Estudiante): void {
    this.selectedEstudiante.set(est);
    this.showBuscarEstudiante.set(false);
    this._cargarCursoEstudiante(est);
  }

  /** Busca estudiante dentro de un modal (retiro, accidente, libro) */
  buscarEstudianteModal(rutONombre: string): void {
    if (!rutONombre.trim()) {
      this.modalEstudiantes.set([]);
      return;
    }
    this.modalSearchQuery.set(rutONombre);
    this.api.getEstudiantes().subscribe(data => {
      const query = rutONombre.toLowerCase();
      const results = data.filter(e =>
        e.rut?.toLowerCase().includes(query) ||
        `${e.nombre} ${e.apellido}`.toLowerCase().includes(query) ||
        e.nombre?.toLowerCase().includes(query) ||
        e.apellido?.toLowerCase().includes(query)
      );
      this.modalEstudiantes.set(results);
      this.showModalStudentSearch.set(results.length > 0);
    });
  }

  /** Selecciona un estudiante desde el buscador del modal */
  seleccionarEstudianteModal(est: Estudiante): void {
    this.selectedEstudiante.set(est);
    this.showModalStudentSearch.set(false);
    this.modalEstudiantes.set([]);
    this.modalSearchQuery.set('');
    this._cargarCursoEstudiante(est);
  }

  /** Cierra el buscador del modal */
  cerrarBusquedaModal(): void {
    this.showModalStudentSearch.set(false);
    this.modalEstudiantes.set([]);
    this.modalSearchQuery.set('');
  }

  /** Carga el nombre del curso del estudiante */
  private _cargarCursoEstudiante(est: Estudiante): void {
    if (est.curso_id) {
      this.api.getCurso(est.curso_id).subscribe(curso => {
        const currentEst = this.selectedEstudiante();
        if (currentEst) {
          (currentEst as any).curso_nombre = `${curso.nivel} ${curso.nombre}`;
          this.selectedEstudiante.set({ ...currentEst });
        }
      });
    }
  }

  generarCertificadoRegular(): void {
    const est = this.selectedEstudiante();
    const userId = this.auth.user()?.id;
    if (!est?.id || !userId) return;

    this.saving.set(true);
    this.lastGeneratedDocType.set('certificado_alumno_regular');
    this.api.generarCertificadoAlumnoRegular({
      estudiante_id: est.id,
      inspector_id: userId,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showPdfPreview.set(true);
        this.pdfPreviewData.set(res.pdf_base64);
        this.showSuccess('Certificado de Alumno Regular generado');
        this.loadInitialData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al generar certificado');
      },
    });
  }

  abrirCertificadoNotas(): void {
    this.showCertificadoNotas.set(true);
  }

  generarCertificadoNotas(anoEscolar: number): void {
    const est = this.selectedEstudiante();
    const userId = this.auth.user()?.id;
    if (!est?.id || !userId) return;

    this.saving.set(true);
    this.lastGeneratedDocType.set('certificado_notas');
    this.api.generarCertificadoNotas({
      estudiante_id: est.id,
      inspector_id: userId,
      ano_escolar: anoEscolar,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showCertificadoNotas.set(false);
        this.showPdfPreview.set(true);
        this.pdfPreviewData.set(res.pdf_base64);
        this.showSuccess('Certificado de Notas generado');
        this.loadInitialData();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al generar certificado de notas');
      },
    });
  }

  // ============ RETIROS ============
  loadRetiros(): void {
    this.api.getRetiros().subscribe(data => this.retiros.set(data));
  }

  abrirRetiroModal(): void {
    this.cerrarBusquedaModal();
    const est = this.selectedEstudiante();
    this.retiroForm = {
      estudiante_id: est?.id || '',
      apoderado_autorizante: '',
      motivo: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_salida: '',
      observacion: '',
    };
    this.showRetiroModal.set(true);
  }

  guardarRetiro(): void {
    const userId = this.auth.user()?.id;
    const est = this.selectedEstudiante();
    const editingDocId = this.editingDocumentoId();
    if (!userId) return;
    if (!est?.id) {
      alert('Debe seleccionar un estudiante');
      return;
    }
    if (!this.retiroForm.apoderado_autorizante || !this.retiroForm.motivo || !this.retiroForm.hora_salida) {
      alert('Complete todos los campos requeridos');
      return;
    }

    this.saving.set(true);
    this.lastGeneratedDocType.set('autorizacion_retiro');
    this.retiroForm.estudiante_id = est.id;

    if (editingDocId) {
      // Edición desde documento existente — misma lógica que crear nuevo
      this.api.generarAutorizacionRetiro({
        ...this.retiroForm,
        inspector_id: userId,
        documento_id: editingDocId,
      }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showRetiroModal.set(false);
          this.editingDocumentoId.set(null);
          this.pdfPreviewData.set(res.pdf_base64);
          this.showPdfPreview.set(true);
          this.showSuccess('Documento actualizado');
          this.loadInitialData();
        },
        error: () => {
          this.saving.set(false);
          alert('Error al generar documento');
        },
      });
    } else {
      // Creación normal
      this.api.generarAutorizacionRetiro({
        ...this.retiroForm,
        inspector_id: userId,
      }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showRetiroModal.set(false);
          this.showPdfPreview.set(true);
          this.pdfPreviewData.set(res.pdf_base64);
          this.showSuccess('Autorización de retiro generada');
          this.loadRetiros();
          this.loadInitialData();
        },
        error: () => {
          this.saving.set(false);
          alert('Error al generar autorización de retiro');
        },
      });
    }
  }

  eliminarRetiro(id: string): void {
    this.openConfirmModal(
      'Eliminar retiro',
      '¿Estás seguro de eliminar este registro de retiro? Esta acción no se puede deshacer.',
      () => {
        this.api.deleteRetiro(id).subscribe({
          next: () => {
            this.showSuccess('Retiro eliminado');
            this.loadRetiros();
          },
          error: () => alert('Error al eliminar retiro'),
        });
      },
    );
  }

  // ============ ACCIDENTES ============
  loadAccidentes(): void {
    this.api.getAccidentes().subscribe(data => this.accidentes.set(data));
  }

  abrirAccidenteModal(): void {
    this.cerrarBusquedaModal();
    const est = this.selectedEstudiante();
    this.accidenteForm = {
      estudiante_id: est?.id || '',
      fecha_accidente: new Date().toISOString().split('T')[0],
      hora_accidente: '',
      lugar: '',
      descripcion: '',
      tipo_lesion: '',
      testigos: '',
      derivacion: '',
    };
    this.showAccidenteModal.set(true);
  }

  guardarAccidente(): void {
    const userId = this.auth.user()?.id;
    const est = this.selectedEstudiante();
    const editingDocId = this.editingDocumentoId();
    if (!userId) return;
    if (!est?.id) {
      alert('Debe seleccionar un estudiante');
      return;
    }
    if (!this.accidenteForm.descripcion) {
      alert('La descripción del accidente es requerida');
      return;
    }

    this.saving.set(true);
    this.lastGeneratedDocType.set('declaracion_accidente');
    this.accidenteForm.estudiante_id = est.id;

    if (editingDocId) {
      // Edición desde documento existente — misma lógica que crear nuevo
      this.api.generarDeclaracionAccidente({
        ...this.accidenteForm,
        inspector_id: userId,
        documento_id: editingDocId,
      }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showAccidenteModal.set(false);
          this.editingDocumentoId.set(null);
          this.pdfPreviewData.set(res.pdf_base64);
          this.showPdfPreview.set(true);
          this.showSuccess('Documento actualizado');
          this.loadInitialData();
        },
        error: () => {
          this.saving.set(false);
          alert('Error al generar documento');
        },
      });
    } else {
      // Creación normal
      this.api.generarDeclaracionAccidente({
        ...this.accidenteForm,
        inspector_id: userId,
      }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showAccidenteModal.set(false);
          this.showPdfPreview.set(true);
          this.pdfPreviewData.set(res.pdf_base64);
          this.showSuccess('Declaración de accidente generada');
          this.loadAccidentes();
          this.loadInitialData();
        },
        error: () => {
          this.saving.set(false);
          alert('Error al generar declaración de accidente');
        },
      });
    }
  }

  eliminarAccidente(id: string): void {
    this.openConfirmModal(
      'Eliminar accidente',
      '¿Estás seguro de eliminar este registro de accidente? Esta acción no se puede deshacer.',
      () => {
        this.api.deleteAccidente(id).subscribe({
          next: () => {
            this.showSuccess('Accidente eliminado');
            this.loadAccidentes();
          },
          error: () => alert('Error al eliminar accidente'),
        });
      },
    );
  }

  cambiarEstadoAccidente(acc: AccidenteEscolar, nuevoEstado: string): void {
    if (acc.id) {
      this.api.updateAccidente(acc.id, { estado: nuevoEstado as any }).subscribe({
        next: () => {
          this.showSuccess(`Estado cambiado a "${nuevoEstado}"`);
          this.loadAccidentes();
        },
        error: () => alert('Error al actualizar estado'),
      });
    }
  }

  // ============ DOCUMENTOS - DETALLE Y ACCIONES ============

  verDetalleDocumento(doc: DocumentoGenerado): void {
    if (!doc.id) return;
    this.api.getDocumento(doc.id).subscribe({
      next: (data) => {
        this.selectedDocumento.set(data);
        this.documentoEditMode.set(false);
        this.showDocumentoDetail.set(true);
      },
      error: () => alert('Error al cargar detalle del documento'),
    });
  }

  closeDocumentoDetail(): void {
    this.showDocumentoDetail.set(false);
    this.selectedDocumento.set(null);
    this.documentoEditMode.set(false);
  }

  eliminarDocumento(id: string): void {
    this.openConfirmModal(
      'Eliminar documento',
      '¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.',
      () => {
        this.api.deleteDocumento(id).subscribe({
          next: () => {
            this.showSuccess('Documento eliminado');
            this.closeDocumentoDetail();
            this.loadInitialData();
          },
          error: () => alert('Error al eliminar documento'),
        });
      },
    );
  }

  /** Descarga el PDF de un documento usando el MISMO endpoint de generación */
  descargarPdfDocumento(): void {
    const doc = this.selectedDocumento();
    if (!doc?.id) return;
    this.saving.set(true);

    const tipo = doc.tipo_documento;
    const inspector_id = doc.inspector_id;
    const estudiante_id = doc.estudiante_id;
    const documento_id = doc.id;

    // Helper para descargar
    const procesarRespuesta = (res: PdfResponse) => {
      this.saving.set(false);
      if (!res.pdf_base64) { alert('Error: PDF vacío'); return; }
      const byteCharacters = atob(res.pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tipo?.replace(/_/g, '-') || 'documento'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess('PDF descargado');
    };

    const onError = () => {
      this.saving.set(false);
      alert('Error al descargar el PDF');
    };

    // Usar el MISMO endpoint de generación que cuando se crea el documento
    if (tipo === 'certificado_alumno_regular') {
      this.api.generarCertificadoAlumnoRegular({ estudiante_id, inspector_id, documento_id }).subscribe({
        next: procesarRespuesta, error: onError,
      });
    } else if (tipo === 'certificado_notas') {
      const ano = doc.datos_adicionales?.ano_escolar;
      this.api.generarCertificadoNotas({ estudiante_id, inspector_id, documento_id, ano_escolar: ano }).subscribe({
        next: procesarRespuesta, error: onError,
      });
    } else if (tipo === 'retiro_alumno' || tipo === 'autorizacion_retiro') {
      const retiroId = doc.datos_adicionales?.retiro_id;
      if (!retiroId) { alert('No hay datos del retiro asociado'); this.saving.set(false); return; }
      this.api.getRetiro(retiroId).subscribe({
        next: (retiro) => {
          this.api.generarAutorizacionRetiro({
            estudiante_id, inspector_id, documento_id,
            apoderado_autorizante: retiro.apoderado_autorizante,
            motivo: retiro.motivo,
            fecha: retiro.fecha,
            hora_salida: retiro.hora_salida,
            observacion: retiro.observacion || '',
          }).subscribe({ next: procesarRespuesta, error: onError });
        },
        error: onError,
      });
    } else if (tipo === 'seguro_escolar') {
      const accidenteId = doc.datos_adicionales?.accidente_id;
      if (!accidenteId) { alert('No hay datos del accidente asociado'); this.saving.set(false); return; }
      this.api.getAccidente(accidenteId).subscribe({
        next: (accidente) => {
          this.api.generarDeclaracionAccidente({
            estudiante_id, inspector_id, documento_id,
            fecha_accidente: accidente.fecha_accidente,
            hora_accidente: accidente.hora_accidente || '',
            lugar: accidente.lugar || '',
            descripcion: accidente.descripcion,
            tipo_lesion: accidente.tipo_lesion || '',
            testigos: accidente.testigos || '',
            derivacion: accidente.derivacion || '',
          }).subscribe({ next: procesarRespuesta, error: onError });
        },
        error: onError,
      });
    } else {
      alert(`Tipo de documento no soportado: ${tipo}`);
      this.saving.set(false);
    }
  }

  descargarPdfDesdeDetalle(): void {
    const pdfData = this.pdfPreviewData();
    if (!pdfData) return;
    const byteCharacters = atob(pdfData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const doc = this.selectedDocumento();
    const filename = `${doc?.tipo_documento?.replace(/_/g, '-') || 'documento'}.pdf`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  editarDocumento(doc: any): void {
    const tipo = doc.tipo_documento;
    this.editingDocumentoId.set(doc.id);

    if (tipo === 'retiro_alumno' || tipo === 'autorizacion_retiro') {
      const retiroId = doc.datos_adicionales?.retiro_id;
      if (retiroId) {
        this.api.getRetiro(retiroId).subscribe({
          next: (retiro) => {
            this.retiroForm = {
              estudiante_id: doc.estudiante_id || '',
              apoderado_autorizante: retiro.apoderado_autorizante || '',
              motivo: retiro.motivo || '',
              fecha: retiro.fecha || '',
              hora_salida: retiro.hora_salida || '',
              observacion: retiro.observacion || '',
            };
            this.showDocumentoDetail.set(false);
            this.showRetiroModal.set(true);
          },
          error: () => alert('Error al cargar datos del retiro'),
        });
      }
    } else if (tipo === 'seguro_escolar') {
      const accidenteId = doc.datos_adicionales?.accidente_id;
      if (accidenteId) {
        this.api.getAccidente(accidenteId).subscribe({
          next: (accidente) => {
            this.accidenteForm = {
              estudiante_id: doc.estudiante_id || '',
              fecha_accidente: accidente.fecha_accidente || '',
              hora_accidente: accidente.hora_accidente || '',
              lugar: accidente.lugar || '',
              descripcion: accidente.descripcion || '',
              tipo_lesion: accidente.tipo_lesion || '',
              testigos: accidente.testigos || '',
              derivacion: accidente.derivacion || '',
            };
            this.showDocumentoDetail.set(false);
            this.showAccidenteModal.set(true);
          },
          error: () => alert('Error al cargar datos del accidente'),
        });
      }
    } else {
      alert('Este tipo de documento no se puede editar');
    }
  }

  getTipoDocumentoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      certificado_alumno_regular: 'Certificado Alumno Regular',
      certificado_notas: 'Certificado de Notas',
      autorizacion_retiro: 'Autorización de Retiro',
      seguro_escolar: 'Declaración Accidente Escolar',
      pase_hora: 'Pase de Hora',
      libro_clases: 'Libro de Clases',
    };
    return labels[tipo] || tipo.replace(/_/g, ' ');
  }

  formatFecha(isoDate: string | undefined): string {
    if (!isoDate) return '';
    // Si ya está en DD-MM-YYYY, devolver como está
    if (/^\d{2}-\d{2}-\d{4}$/.test(isoDate)) return isoDate;
    // Convertir de ISO (YYYY-MM-DD) a DD-MM-YYYY
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
  }

  // ============ ASISTENCIA GENERAL ============
  loadAsistenciaData(): void {
    const fecha = this.fechaAsistencia();
    this.api.getAsistenciaGeneral({ fecha }).subscribe(data => {
      // Agrupar por curso
      this.asistenciaGeneral = data;
    });
    this.api.getInasistenciasCriticas().subscribe(data => {
      this.inasistenciasCriticas.set(data);
    });
  }
  asistenciaGeneral: Asistencia[] = [];

  getAsistenciaPorCurso(cursoId: string): Asistencia[] {
    return this.asistenciaGeneral.filter(a => a.curso_id === cursoId);
  }

  getCursoNombre(cursoId: string): string {
    const curso = this.cursos().find(c => c.id === cursoId);
    return curso ? `${curso.nivel} ${curso.nombre}` : 'Curso desconocido';
  }

  getAsistenciaStats(cursoId: string): { presentes: number; ausentes: number; total: number } {
    const registros = this.getAsistenciaPorCurso(cursoId);
    const total = registros.length;
    const presentes = registros.filter(a => a.presente).length;
    return { presentes, ausentes: total - presentes, total };
  }

  onFechaAsistenciaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaAsistencia.set(input.value);
    this.loadAsistenciaData();
  }

  // ============ LIBRO DE INSPECTORÍA ============
  loadLibro(): void {
    this.api.getLibroInspectoria().subscribe({
      next: (data) => this.libroRegistros.set(data),
      error: (err) => {
        console.error('Error al cargar libro de inspectoría:', err);
        this.libroRegistros.set([]);
      },
    });
  }

  abrirLibroModal(): void {
    this.cerrarBusquedaModal();
    const est = this.selectedEstudiante();
    this.libroForm = {
      tipo: 'otro',
      estudiante_id: est?.id || '',
      curso_id: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
    };
    this.showLibroModal.set(true);
  }

  guardarLibro(): void {
    const userId = this.auth.user()?.id;
    const est = this.selectedEstudiante();
    if (!userId) return;
    if (!est?.id) {
      alert('Debe seleccionar un estudiante');
      return;
    }
    if (!this.libroForm.descripcion) {
      alert('La descripción del registro es requerida');
      return;
    }

    this.saving.set(true);
    this.libroForm.estudiante_id = est.id;
    this.api.createLibroInspectoria({
      ...this.libroForm,
      inspector_id: userId,
    } as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.showLibroModal.set(false);
        this.showSuccess('Registro añadido al libro de inspectoría');
        this.loadLibro();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al guardar registro');
      },
    });
  }

  eliminarLibroRegistro(id: string): void {
    this.openConfirmModal(
      'Eliminar registro',
      '¿Estás seguro de eliminar este registro del libro de inspectoría? Esta acción no se puede deshacer.',
      () => {
        this.api.deleteLibroInspectoria(id).subscribe({
          next: () => {
            this.showSuccess('Registro eliminado');
            this.loadLibro();
          },
          error: () => alert('Error al eliminar registro'),
        });
      },
    );
  }

  getTipoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      llegada_tarde: 'schedule',
      sin_materiales: 'bookmark_border',
      conducta: 'warning',
      comunicado: 'campaign',
      otro: 'more_horiz',
    };
    return icons[tipo] || 'more_horiz';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      llegada_tarde: 'Llegada Tarde',
      sin_materiales: 'Sin Materiales',
      conducta: 'Conducta',
      comunicado: 'Comunicado',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  }

  // ============ HELPERS ============
  showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  // Mapeo de tipo_documento interno a nombre legible para el archivo
  private readonly DOC_FILENAMES: Record<string, string> = {
    certificado_alumno_regular: 'certificado_alumnoregular',
    certificado_notas: 'certificado_notas',
    autorizacion_retiro: 'autorizacion_retiro',
    retiro_alumno: 'autorizacion_retiro',
    declaracion_accidente: 'declaracion_accidente',
    seguro_escolar: 'declaracion_accidente',
  };

  closePdfPreview(): void {
    this.showPdfPreview.set(false);
    this.pdfPreviewData.set('');
    this.lastGeneratedDocType.set('');
  }

  downloadPdf(): void {
    const base64 = this.pdfPreviewData();
    if (!base64) return;

    const est = this.selectedEstudiante();
    const docType = this.lastGeneratedDocType();
    const nombreBase = this.DOC_FILENAMES[docType] || 'documento';

    // Construir nombre: ApellidoNombre_tipo.pdf
    let nombreAlumno = 'documento';
    if (est?.apellido && est?.nombre) {
      nombreAlumno = `${est.apellido}_${est.nombre}`.replace(/\s+/g, '');
    } else if (est?.nombre) {
      nombreAlumno = est.nombre.replace(/\s+/g, '');
    }
    const filename = `${nombreAlumno}_${nombreBase}.pdf`;

    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  logout(): void {
    this.auth.logout();
  }

  // Array de tipos de registro para el libro
  tiposLibro = [
    { value: 'llegada_tarde', label: 'Llegada Tarde' },
    { value: 'sin_materiales', label: 'Sin Materiales' },
    { value: 'conducta', label: 'Conducta' },
    { value: 'comunicado', label: 'Comunicado' },
    { value: 'otro', label: 'Otro' },
  ];

  // Lugares de accidente
  lugaresAccidente = [
    { value: 'patio', label: 'Patio' },
    { value: 'sala', label: 'Sala de Clases' },
    { value: 'baño', label: 'Baño' },
    { value: 'pasillo', label: 'Pasillo' },
    { value: 'entrada', label: 'Entrada' },
    { value: 'otro', label: 'Otro' },
  ];
}
