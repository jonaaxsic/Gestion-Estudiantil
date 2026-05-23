// Models for the application

export interface Usuario {
  id?: string;
  rut?: string;
  email: string;
  username: string;
  password?: string;
  rol: 'docente' | 'apoderado' | 'administrador' | 'inspector_general';
  nombre: string;
  apellido: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  token?: string;
  sub_rol?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Estudiante {
  id?: string;
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  direccion?: string;
  telefono?: string;
  curso_id?: string;
  apoderado_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Curso {
  id?: string;
  nombre: string;
  nivel: string;
  ano: number;
  created_at?: string;
  updated_at?: string;
}

export interface Asistencia {
  id?: string;
  estudiante_id: string;
  curso_id?: string;
  fecha: string;
  presente: boolean;
  observacion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Evaluacion {
  id?: string;
  curso_id: string;
  materia: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  ponderacion?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Anotacion {
  id?: string;
  estudiante_id: string;
  tipo: 'positiva' | 'negativa';
  descripcion: string;
  fecha: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reunione {
  id?: string;
  curso_id: string;
  fecha: string;
  hora: string;
  lugar: string;
  descripcion?: string;
  notificacion_enviada: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Apoderado {
  id?: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estudiante_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recordatorio {
  id?: string;
  usuario_id: string;
  titulo: string;
  descripcion?: string;
  fecha_creacion?: string;
  fecha_limite?: string;
  completada: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AsignacionDocente {
  id?: string;
  docente_id: string;
  curso_id: string;
  asignatura: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Usuario;
  error?: string;
}

export interface Nota {
  id?: string;
  estudiante_id: string;
  curso_id: string;
  asignatura: string;
  ano_escolar: number;
  notas?: { [key: string]: number | null | undefined };
  nota_final?: number | null;
  cerrado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardDocente {
  totalEstudiantes: number;
  asistenciaHoy: number;
  evaluacionesProximas: Evaluacion[];
}

export interface DashboardApoderado {
  estudiante: Estudiante;
  asistencia: Asistencia[];
  evaluaciones: Evaluacion[];
  anotaciones: Anotacion[];
}

// ============================================================
// MODELOS DEL INSPECTOR GENERAL
// ============================================================

export interface DocumentoGenerado {
  id?: string;
  tipo_documento: 'certificado_alumno_regular' | 'certificado_notas' | 'retiro_alumno' | 'seguro_escolar' | 'pase_hora' | 'libro_clases';
  estudiante_id?: string;
  inspector_id: string;
  fecha_emision?: string;
  datos_adicionales?: any;
  estado: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccidenteEscolar {
  id?: string;
  estudiante_id: string;
  fecha_accidente: string;
  hora_accidente?: string;
  lugar?: string;
  descripcion: string;
  tipo_lesion?: string;
  testigos?: string;
  inspector_id: string;
  derivacion?: string;
  estado: 'pendiente' | 'derivado' | 'cerrado';
  created_at?: string;
  updated_at?: string;
}

export interface RetiroAlumno {
  id?: string;
  estudiante_id: string;
  apoderado_autorizante: string;
  motivo: string;
  fecha: string;
  hora_salida: string;
  inspector_id: string;
  observacion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LibroInspectoria {
  id?: string;
  tipo: 'llegada_tarde' | 'sin_materiales' | 'conducta' | 'comunicado' | 'otro';
  estudiante_id?: string;
  curso_id: string;
  descripcion: string;
  inspector_id: string;
  fecha: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConfiguracionEstablecimiento {
  id?: string;
  nombre: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  director?: string;
  inspector_general?: string;
  logo_url?: string;
  codigo_sostenedor?: string;
  dependencia?: string;
  region?: string;
  comuna?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardInspector {
  documentos_hoy: number;
  retiros_hoy: number;
  accidentes_mes: number;
  accidentes_pendientes: number;
  inasistencias_criticas: InasistenciaCritica[];
  documentos_recientes: DocumentoGenerado[];
  retiros_recientes: RetiroAlumno[];
  accidentes_recientes: AccidenteEscolar[];
}

export interface InasistenciaCritica {
  estudiante_id: string;
  nombre: string;
  rut: string;
  total_inasistencias: number;
}

export interface PdfResponse {
  success: boolean;
  message: string;
  documento_id?: string;
  retiro_id?: string;
  accidente_id?: string;
  pdf_base64: string;
}
