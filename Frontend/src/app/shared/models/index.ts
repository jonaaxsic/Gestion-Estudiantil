// Models for the application

export interface Usuario {
  id?: string;
  rut?: string;
  email: string;
  username: string;
  password?: string;
  rol: 'docente' | 'apoderado' | 'administrador';
  nombre: string;
  apellido: string;
  telefono?: string;
  activo: boolean;
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

export interface LoginResponse {
  success: boolean;
  user?: Usuario;
  error?: string;
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
