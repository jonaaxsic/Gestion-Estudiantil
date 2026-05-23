"""
Modelos para la aplicación de gestión estudiantil
Basados en la estructura de MongoDB existente
"""

from datetime import datetime
from .database import get_collection
from bson import ObjectId


class BaseModel:
    """Clase base para todos los modelos"""

    collection_name = None

    def __init__(self, data=None):
        self._id = None
        self.created_at = None
        self.updated_at = None
        if data:
            self._load_from_dict(data)

    def _load_from_dict(self, data):
        """Cargar datos desde un diccionario"""
        self._id = str(data.get("_id")) if data.get("_id") else None
        self.created_at = data.get("created_at")
        self.updated_at = data.get("updated_at")

    @classmethod
    def get_collection(cls):
        """Obtener la colección de MongoDB"""
        return get_collection(cls.collection_name)

    def to_dict(self):
        """Convertir a diccionario"""
        result = {}
        if self._id:
            result["_id"] = self._id
        if self.created_at:
            result["created_at"] = self.created_at
        if self.updated_at:
            result["updated_at"] = self.updated_at
        return result

    def save(self):
        """Guardar en MongoDB"""
        try:
            now = datetime.now()
            data = self.to_dict()

            print(f"DEBUG Model.save() - collection: {self.collection_name}")
            print(f"DEBUG Model.save() - data: {data}")

            if self._id:
                # Update
                data.pop("_id", None)
                data["updated_at"] = now
                result = self.get_collection().update_one(
                    {"_id": ObjectId(self._id)}, {"$set": data}
                )
                print(f"DEBUG Model.save() - Updated OK")
            else:
                # Insert
                data["created_at"] = now
                data["updated_at"] = now
                result = self.get_collection().insert_one(data)
                self._id = str(result.inserted_id)
                self.created_at = data["created_at"]
                self.updated_at = data["updated_at"]
                print(f"DEBUG Model.save() - Inserted OK, _id: {self._id}")

            return self
        except Exception as e:
            print(f"ERROR in Model.save() - {type(e).__name__}: {e}")
            import traceback

            traceback.print_exc()
            raise

    def delete(self):
        """Eliminar de MongoDB"""
        if self._id:
            self.get_collection().delete_one({"_id": ObjectId(self._id)})
            return True
        return False

    @classmethod
    def find_one(cls, query):
        """Buscar un documento"""
        collection = cls.get_collection()
        result = collection.find_one(query)
        if result:
            return cls(result)
        return None

    @classmethod
    def find(cls, query=None, **kwargs):
        """Buscar múltiples documentos"""
        collection = cls.get_collection()
        limit = kwargs.get("limit")
        skip = kwargs.get("skip")
        sort = kwargs.get("sort")

        # Get all results
        cursor = collection.find(query or {})

        results = []
        for doc in cursor:
            results.append(cls(doc))

        # Apply sorting if needed
        if sort:
            # sort is a list of tuples like [("campo", 1 or -1)]
            field, direction = sort[0]
            results.sort(
                key=lambda x: getattr(x, field, "") or "", reverse=(direction == -1)
            )

        # Apply skip and limit
        if skip:
            results = results[skip:]
        if limit:
            results = results[:limit]

        return results

    @classmethod
    def count(cls, query=None):
        """Contar documentos"""
        return cls.get_collection().count_documents(query or {})


class Usuario(BaseModel):
    """Modelo para usuarios del sistema"""

    collection_name = "usuarios"

    def __init__(self, data=None):
        self.rut = None
        self.email = None
        self.username = None
        self.password = None
        self.rol = None  # 'docente', 'apoderado', 'administrador', 'inspector_general'
        self.nombre = None
        self.apellido = None
        self.telefono = None
        self.activo = True
        self.sub_rol = None  # Opcional, solo para inspector_patio
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.rut = data.get("rut")
        self.email = data.get("email")
        self.username = data.get("username")
        self.password = data.get("password")
        self.rol = data.get("rol")
        self.nombre = data.get("nombre")
        self.apellido = data.get("apellido")
        self.telefono = data.get("telefono")
        self.activo = data.get("activo", True)
        self.sub_rol = data.get("sub_rol")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "rut": self.rut,
                "email": self.email,
                "username": self.username,
                "password": self.password,
                "rol": self.rol,
                "nombre": self.nombre,
                "apellido": self.apellido,
                "telefono": self.telefono,
                "activo": self.activo,
                "sub_rol": self.sub_rol,
            }
        )
        return data


class Estudiante(BaseModel):
    """Modelo para estudiantes"""

    collection_name = "estudiantes"

    def __init__(self, data=None):
        self.rut = None
        self.nombre = None
        self.apellido = None
        self.fecha_nacimiento = None
        self.direccion = None
        self.telefono = None
        self.curso_id = None
        self.apoderado_id = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.rut = data.get("rut")
        self.nombre = data.get("nombre")
        self.apellido = data.get("apellido")
        self.fecha_nacimiento = data.get("fecha_nacimiento")
        self.direccion = data.get("direccion")
        self.telefono = data.get("telefono")
        self.curso_id = data.get("curso_id")
        self.apoderado_id = data.get("apoderado_id")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "rut": self.rut,
                "nombre": self.nombre,
                "apellido": self.apellido,
                "fecha_nacimiento": self.fecha_nacimiento,
                "direccion": self.direccion,
                "telefono": self.telefono,
                "curso_id": self.curso_id,
                "apoderado_id": self.apoderado_id,
            }
        )
        return data


class Curso(BaseModel):
    """Modelo para cursos"""

    collection_name = "cursos"

    def __init__(self, data=None):
        self.nombre = None
        self.nivel = None
        self.ano = None
        self.año = None  # Alias para compatibilidad con serializer
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.nombre = data.get("nombre")
        self.nivel = data.get("nivel")
        self.ano = data.get("año") or data.get("ano")
        self.año = self.ano  # Mantener ambos atributos

    @property
    def año(self):
        return self.ano

    @año.setter
    def año(self, value):
        self.ano = value

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "nombre": self.nombre,
                "nivel": self.nivel,
                "año": self.ano,
                "ano": self.ano,
            }
        )
        return data


class Asistencia(BaseModel):
    """Modelo para asistencia"""

    collection_name = "asistencia"

    def __init__(self, data=None):
        self.estudiante_id = None
        self.curso_id = None
        self.fecha = None
        self.presente = None
        self.observacion = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.estudiante_id = data.get("estudiante_id")
        self.curso_id = data.get("curso_id")
        self.fecha = data.get("fecha")
        self.presente = data.get("presente")
        self.observacion = data.get("observacion")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "estudiante_id": self.estudiante_id,
                "curso_id": self.curso_id,
                "fecha": self.fecha,
                "presente": self.presente,
                "observacion": self.observacion,
            }
        )
        return data


class Evaluacion(BaseModel):
    """Modelo para evaluaciones"""

    collection_name = "evaluaciones"

    def __init__(self, data=None):
        self.curso_id = None
        self.materia = None
        self.titulo = None
        self.descripcion = None
        self.fecha = None
        self.ponderacion = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.curso_id = data.get("curso_id")
        self.materia = data.get("materia")
        self.titulo = data.get("titulo")
        self.descripcion = data.get("descripcion")
        self.fecha = data.get("fecha")
        self.ponderacion = data.get("ponderacion")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "curso_id": self.curso_id,
                "materia": self.materia,
                "titulo": self.titulo,
                "descripcion": self.descripcion,
                "fecha": self.fecha,
                "ponderacion": self.ponderacion,
            }
        )
        return data


class Anotacion(BaseModel):
    """Modelo para anotaciones"""

    collection_name = "anotaciones"

    def __init__(self, data=None):
        self.estudiante_id = None
        self.tipo = None  # 'positiva', 'negativa'
        self.descripcion = None
        self.fecha = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.estudiante_id = data.get("estudiante_id")
        self.tipo = data.get("tipo")
        self.descripcion = data.get("descripcion")
        self.fecha = data.get("fecha")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "estudiante_id": self.estudiante_id,
                "tipo": self.tipo,
                "descripcion": self.descripcion,
                "fecha": self.fecha,
            }
        )
        return data


class Reunione(BaseModel):
    """Modelo para reuniones de apoderados"""

    collection_name = "reuniones"

    def __init__(self, data=None):
        self.curso_id = None
        self.fecha = None
        self.hora = None
        self.lugar = None
        self.descripcion = None
        self.notificacion_enviada = False
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.curso_id = data.get("curso_id")
        self.fecha = data.get("fecha")
        self.hora = data.get("hora")
        self.lugar = data.get("lugar")
        self.descripcion = data.get("descripcion")
        self.notificacion_enviada = data.get("notificacion_enviada", False)

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "curso_id": self.curso_id,
                "fecha": self.fecha,
                "hora": self.hora,
                "lugar": self.lugar,
                "descripcion": self.descripcion,
                "notificacion_enviada": self.notificacion_enviada,
            }
        )
        return data


class Apoderado(BaseModel):
    """Modelo para apoderados"""

    collection_name = "apoderados"

    def __init__(self, data=None):
        self.rut = None
        self.nombre = None
        self.apellido = None
        self.telefono = None
        self.email = None
        self.direccion = None
        self.estudiante_id = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.rut = data.get("rut")
        self.nombre = data.get("nombre")
        self.apellido = data.get("apellido")
        self.telefono = data.get("telefono")
        self.email = data.get("email")
        self.direccion = data.get("direccion")
        self.estudiante_id = data.get("estudiante_id")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "rut": self.rut,
                "nombre": self.nombre,
                "apellido": self.apellido,
                "telefono": self.telefono,
                "email": self.email,
                "direccion": self.direccion,
                "estudiante_id": self.estudiante_id,
            }
        )
        return data


class Recordatorio(BaseModel):
    """Modelo para notas de recordatorio"""

    collection_name = "recordatorios"

    def __init__(self, data=None):
        self.usuario_id = None  # ID del usuario que creó el recordatorio
        self.titulo = None
        self.descripcion = None
        self.fecha = None  # Fecha del recordatorio
        self.hora = None  # Hora del recordatorio (opcional)
        self.privado = True  # Solo visible por el usuario que lo creó
        self.completada = False  # Estado de completado
        self.fecha_limite = None  # Fecha límite (alias de fecha para compatibilidad)
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.usuario_id = data.get("usuario_id")
        self.titulo = data.get("titulo")
        self.descripcion = data.get("descripcion")
        self.fecha = data.get("fecha")
        self.fecha_limite = data.get("fecha_limite") or data.get("fecha")
        self.hora = data.get("hora")
        self.privado = data.get("privado", True)
        self.completada = data.get("completada", False)

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "usuario_id": self.usuario_id,
                "titulo": self.titulo,
                "descripcion": self.descripcion,
                "fecha": self.fecha_limite or self.fecha,
                "fecha_limite": self.fecha_limite,
                "hora": self.hora,
                "privado": self.privado,
                "completada": self.completada,
            }
        )
        return data


class AsignacionDocente(BaseModel):
    """Modelo para asignar docentes a cursos con su asignatura"""

    collection_name = "asignaciones_docente"

    def __init__(self, data=None):
        self.docente_id = None  # ID del usuario docente
        self.curso_id = None  # ID del curso
        self.asignatura = None  # Nombre de la asignatura
        self.activo = True  # Si la asignación está activa
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.docente_id = data.get("docente_id")
        self.curso_id = data.get("curso_id")
        self.asignatura = data.get("asignatura")
        self.activo = data.get("activo", True)

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "docente_id": self.docente_id,
                "curso_id": self.curso_id,
                "asignatura": self.asignatura,
                "activo": self.activo,
            }
        )
        return data


class Nota(BaseModel):
    """Modelo para gestionar notas de estudiantes por asignatura y año escolar"""

    collection_name = "notas"

    def __init__(self, data=None):
        self.estudiante_id = None  # ID del estudiante
        self.curso_id = None  # ID del curso
        self.asignatura = None  # Nombre de la asignatura (ej: Matemática, Historia)
        self.ano_escolar = None  # Año escolar (ej: 2026)
        self.notas = None  # Lista de notas (6 notas anuales)
        # Formato notas: {"nota1": 6.5, "nota2": 7.0, "nota3": None, ...}
        self.nota_final = None  # Promedio final de las notas ingresadas
        self.cerrado = None  # Si el ramo está cerrado (después del 25 diciembre)
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.estudiante_id = data.get("estudiante_id")
        self.curso_id = data.get("curso_id")
        self.asignatura = data.get("asignatura")
        self.ano_escolar = data.get("ano_escolar")
        self.notas = data.get("notas")
        self.nota_final = data.get("nota_final")
        self.cerrado = data.get("cerrado", False)

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "estudiante_id": self.estudiante_id,
                "curso_id": self.curso_id,
                "asignatura": self.asignatura,
                "ano_escolar": self.ano_escolar,
                "notas": self.notas,
                "nota_final": self.nota_final,
                "cerrado": self.cerrado,
            }
        )
        return data

    def calcular_promedio(self):
        """Calcula el promedio de las notas ingresadas"""
        if not self.notas:
            return None
        valores = [v for v in self.notas.values() if v is not None]
        if not valores:
            return None
        return round(sum(valores) / len(valores), 1)


# ============================================================
# MODELOS DEL INSPECTOR GENERAL
# ============================================================


class DocumentoGenerado(BaseModel):
    """Modelo para documentos emitidos por el inspector general"""

    collection_name = "documentos_generados"

    def __init__(self, data=None):
        self.tipo_documento = None  # 'certificado_alumno_regular', 'certificado_notas', 'retiro_alumno', 'seguro_escolar', 'pase_hora', 'libro_clases'
        self.estudiante_id = None
        self.inspector_id = None
        self.fecha_emision = None
        self.datos_adicionales = {}
        self.estado = "emitido"
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.tipo_documento = data.get("tipo_documento")
        self.estudiante_id = data.get("estudiante_id")
        self.inspector_id = data.get("inspector_id")
        self.fecha_emision = data.get("fecha_emision")
        self.datos_adicionales = data.get("datos_adicionales", {})
        self.estado = data.get("estado", "emitido")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "tipo_documento": self.tipo_documento,
                "estudiante_id": self.estudiante_id,
                "inspector_id": self.inspector_id,
                "fecha_emision": self.fecha_emision,
                "datos_adicionales": self.datos_adicionales,
                "estado": self.estado,
            }
        )
        return data


class AccidenteEscolar(BaseModel):
    """Modelo para registro de accidentes escolares (seguro escolar)"""

    collection_name = "accidentes_escolares"

    def __init__(self, data=None):
        self.estudiante_id = None
        self.fecha_accidente = None
        self.hora_accidente = None
        self.lugar = None  # 'patio', 'sala', 'baño', 'pasillo', 'entrada'
        self.descripcion = None
        self.tipo_lesion = None
        self.testigos = None
        self.inspector_id = None
        self.derivacion = None  # Hospital o clínica a la que se deriva
        self.estado = "pendiente"  # 'pendiente', 'derivado', 'cerrado'
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.estudiante_id = data.get("estudiante_id")
        self.fecha_accidente = data.get("fecha_accidente")
        self.hora_accidente = data.get("hora_accidente")
        self.lugar = data.get("lugar")
        self.descripcion = data.get("descripcion")
        self.tipo_lesion = data.get("tipo_lesion")
        self.testigos = data.get("testigos")
        self.inspector_id = data.get("inspector_id")
        self.derivacion = data.get("derivacion")
        self.estado = data.get("estado", "pendiente")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "estudiante_id": self.estudiante_id,
                "fecha_accidente": self.fecha_accidente,
                "hora_accidente": self.hora_accidente,
                "lugar": self.lugar,
                "descripcion": self.descripcion,
                "tipo_lesion": self.tipo_lesion,
                "testigos": self.testigos,
                "inspector_id": self.inspector_id,
                "derivacion": self.derivacion,
                "estado": self.estado,
            }
        )
        return data


class RetiroAlumno(BaseModel):
    """Modelo para registrar retiros autorizados de alumnos"""

    collection_name = "retiros_alumno"

    def __init__(self, data=None):
        self.estudiante_id = None
        self.apoderado_autorizante = None  # Nombre y RUT del apoderado
        self.motivo = None
        self.fecha = None
        self.hora_salida = None
        self.inspector_id = None
        self.observacion = ""
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.estudiante_id = data.get("estudiante_id")
        self.apoderado_autorizante = data.get("apoderado_autorizante")
        self.motivo = data.get("motivo")
        self.fecha = data.get("fecha")
        self.hora_salida = data.get("hora_salida")
        self.inspector_id = data.get("inspector_id")
        self.observacion = data.get("observacion", "")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "estudiante_id": self.estudiante_id,
                "apoderado_autorizante": self.apoderado_autorizante,
                "motivo": self.motivo,
                "fecha": self.fecha,
                "hora_salida": self.hora_salida,
                "inspector_id": self.inspector_id,
                "observacion": self.observacion,
            }
        )
        return data


class LibroInspectoria(BaseModel):
    """Modelo para el libro de inspectoría (registro diario de eventos)"""

    collection_name = "libro_inspectoria"

    def __init__(self, data=None):
        self.tipo = None  # 'llegada_tarde', 'sin_materiales', 'conducta', 'comunicado', 'otro'
        self.estudiante_id = None  # Opcional, si aplica a un estudiante específico
        self.curso_id = None
        self.descripcion = None
        self.inspector_id = None
        self.fecha = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.tipo = data.get("tipo")
        self.estudiante_id = data.get("estudiante_id")
        self.curso_id = data.get("curso_id")
        self.descripcion = data.get("descripcion")
        self.inspector_id = data.get("inspector_id")
        self.fecha = data.get("fecha")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "tipo": self.tipo,
                "estudiante_id": self.estudiante_id,
                "curso_id": self.curso_id,
                "descripcion": self.descripcion,
                "inspector_id": self.inspector_id,
                "fecha": self.fecha,
            }
        )
        return data


class ConfiguracionEstablecimiento(BaseModel):
    """Modelo para la configuración del establecimiento (datos para PDFs)"""

    collection_name = "configuracion_establecimiento"

    def __init__(self, data=None):
        self.nombre = None
        self.rut = None
        self.direccion = None
        self.telefono = None
        self.email = None
        self.director = None
        self.inspector_general = None
        self.logo_url = None
        self.codigo_sostenedor = None
        self.dependencia = None  # 'Municipal', 'Particular', etc.
        self.region = None
        self.comuna = None
        super().__init__(data)

    def _load_from_dict(self, data):
        super()._load_from_dict(data)
        self.nombre = data.get("nombre")
        self.rut = data.get("rut")
        self.direccion = data.get("direccion")
        self.telefono = data.get("telefono")
        self.email = data.get("email")
        self.director = data.get("director")
        self.inspector_general = data.get("inspector_general")
        self.logo_url = data.get("logo_url")
        self.codigo_sostenedor = data.get("codigo_sostenedor")
        self.dependencia = data.get("dependencia")
        self.region = data.get("region")
        self.comuna = data.get("comuna")

    def to_dict(self):
        data = super().to_dict()
        data.update(
            {
                "nombre": self.nombre,
                "rut": self.rut,
                "direccion": self.direccion,
                "telefono": self.telefono,
                "email": self.email,
                "director": self.director,
                "inspector_general": self.inspector_general,
                "logo_url": self.logo_url,
                "codigo_sostenedor": self.codigo_sostenedor,
                "dependencia": self.dependencia,
                "region": self.region,
                "comuna": self.comuna,
            }
        )
        return data
