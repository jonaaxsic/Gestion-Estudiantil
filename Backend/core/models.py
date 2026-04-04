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
        now = datetime.now()
        data = self.to_dict()

        if self._id:
            # Update - exclude _id from the data to prevent immutable field error
            data.pop("_id", None)
            data["updated_at"] = now
            self.get_collection().update_one(
                {"_id": ObjectId(self._id)}, {"$set": data}
            )
        else:
            # Insert
            data["created_at"] = now
            data["updated_at"] = now
            result = self.get_collection().insert_one(data)
            self._id = str(result.inserted_id)
            self.created_at = data["created_at"]
            self.updated_at = data["updated_at"]

        return self

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

        cursor = collection.find(query or {})

        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)

        return [cls(doc) for doc in cursor]

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
        self.rol = None  # 'docente', 'apoderado', 'administrador'
        self.nombre = None
        self.apellido = None
        self.telefono = None
        self.activo = True
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
