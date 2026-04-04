"""
Views/ViewSets para la API REST
Implementan los endpoints de la aplicación
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from bson import ObjectId
from .models import (
    Usuario,
    Estudiante,
    Curso,
    Asistencia,
    Evaluacion,
    Anotacion,
    Reunione,
    Apoderado,
)
from .serializers import (
    UsuarioSerializer,
    EstudianteSerializer,
    CursoSerializer,
    AsistenciaSerializer,
    EvaluacionSerializer,
    AnotacionSerializer,
    ReunioneSerializer,
    ApoderadoSerializer,
)


class MongoObjectIdMixin:
    """Mixin para convertir ObjectIds de MongoDB"""

    def _convert_object_ids(self, data):
        """Convierte string IDs a ObjectId para consultas"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key in ["_id", "id", "estudiante_id", "curso_id", "apoderado_id"]:
                    if value and isinstance(value, str):
                        try:
                            result[key] = ObjectId(value)
                        except:
                            result[key] = value
                    else:
                        result[key] = value
                else:
                    result[key] = self._convert_object_ids(value)
            return result
        elif isinstance(data, list):
            return [self._convert_object_ids(item) for item in data]
        return data


# ============ USUARIOS ============
class UsuarioList(APIView, MongoObjectIdMixin):
    """Listar todos los usuarios o crear nuevo"""

    def get(self, request):
        usuarios = Usuario.find(sort=[("created_at", -1)])
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioDetail(APIView, MongoObjectIdMixin):
    """Detalle de un usuario específico"""

    def get_object(self, pk):
        return Usuario.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        usuario = self.get_object(pk)
        if not usuario:
            return Response(
                {"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data)

    def put(self, request, pk):
        usuario = self.get_object(pk)
        if not usuario:
            return Response(
                {"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UsuarioSerializer(usuario, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        usuario = self.get_object(pk)
        if not usuario:
            return Response(
                {"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def login_view(request):
    """Endpoint de login"""
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email y password requeridos"}, status=status.HTTP_400_BAD_REQUEST
        )

    usuario = Usuario.find_one({"email": email, "password": password, "activo": True})

    if usuario:
        serializer = UsuarioSerializer(usuario)
        return Response({"success": True, "user": serializer.data})

    return Response(
        {"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED
    )


# ============ ESTUDIANTES ============
class EstudianteList(APIView, MongoObjectIdMixin):
    """Listar estudiantes o crear nuevo"""

    def get(self, request):
        query = {}
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")

        estudiantes = Estudiante.find(query, sort=[("apellido", 1)])
        serializer = EstudianteSerializer(estudiantes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EstudianteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EstudianteDetail(APIView, MongoObjectIdMixin):
    """Detalle de un estudiante"""

    def get_object(self, pk):
        return Estudiante.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EstudianteSerializer(estudiante)
        return Response(serializer.data)

    def put(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EstudianteSerializer(estudiante, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        estudiante = self.get_object(pk)
        if not estudiante:
            return Response(
                {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        estudiante.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ CURSOS ============
class CursoList(APIView, MongoObjectIdMixin):
    """Listar cursos o crear nuevo"""

    def get(self, request):
        cursos = Curso.find(sort=[("nombre", 1)])
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CursoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CursoDetail(APIView, MongoObjectIdMixin):
    """Detalle de un curso"""

    def get_object(self, pk):
        return Curso.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = CursoSerializer(curso)
        return Response(serializer.data)

    def put(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        # Actualizar directamente sin usar el serializer
        data = request.data
        if "nombre" in data:
            curso.nombre = data["nombre"]
        if "nivel" in data:
            curso.nivel = data["nivel"]
        if "ano" in data:
            curso.ano = data["ano"]

        curso.save()

        serializer = CursoSerializer(curso)
        return Response(serializer.data)

    def delete(self, request, pk):
        curso = self.get_object(pk)
        if not curso:
            return Response(
                {"error": "Curso no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        curso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ ASISTENCIA ============
class AsistenciaList(APIView, MongoObjectIdMixin):
    """Listar asistencia o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("fecha"):
            query["fecha"] = request.query_params.get("fecha")

        asistencia = Asistencia.find(query, sort=[("fecha", -1)])
        serializer = AsistenciaSerializer(asistencia, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AsistenciaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AsistenciaBulk(APIView, MongoObjectIdMixin):
    """Crear asistencia masiva para un curso"""

    def post(self, request):
        curso_id = request.data.get("curso_id")
        fecha = request.data.get("fecha")
        registros = request.data.get("registros", [])

        if not curso_id or not fecha or not registros:
            return Response(
                {"error": "curso_id, fecha y registros requeridos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        for registro in registros:
            asistencia = Asistencia(
                {
                    "estudiante_id": registro.get("estudiante_id"),
                    "curso_id": curso_id,
                    "fecha": fecha,
                    "presente": registro.get("presente", True),
                    "observacion": registro.get("observacion"),
                }
            )
            asistencia.save()
            created += 1

        return Response({"created": created}, status=status.HTTP_201_CREATED)


class AsistenciaDetail(APIView, MongoObjectIdMixin):
    """Detalle de asistencia"""

    def get_object(self, pk):
        return Asistencia.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsistenciaSerializer(asistencia)
        return Response(serializer.data)

    def put(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AsistenciaSerializer(asistencia, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        asistencia = self.get_object(pk)
        if not asistencia:
            return Response(
                {"error": "Asistencia no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        asistencia.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ EVALUACIONES ============
class EvaluacionList(APIView, MongoObjectIdMixin):
    """Listar evaluaciones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("materia"):
            query["materia"] = request.query_params.get("materia")

        evaluaciones = Evaluacion.find(query, sort=[("fecha", -1)])
        serializer = EvaluacionSerializer(evaluaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EvaluacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EvaluacionDetail(APIView, MongoObjectIdMixin):
    """Detalle de evaluacion"""

    def get_object(self, pk):
        return Evaluacion.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EvaluacionSerializer(evaluacion)
        return Response(serializer.data)

    def put(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = EvaluacionSerializer(evaluacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        evaluacion = self.get_object(pk)
        if not evaluacion:
            return Response(
                {"error": "Evaluación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        evaluacion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ ANOTACIONES ============
class AnotacionList(APIView, MongoObjectIdMixin):
    """Listar anotaciones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("tipo"):
            query["tipo"] = request.query_params.get("tipo")

        anotaciones = Anotacion.find(query, sort=[("fecha", -1)])
        serializer = AnotacionSerializer(anotaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AnotacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnotacionDetail(APIView, MongoObjectIdMixin):
    """Detalle de anotacion"""

    def get_object(self, pk):
        return Anotacion.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AnotacionSerializer(anotacion)
        return Response(serializer.data)

    def put(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = AnotacionSerializer(anotacion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        anotacion = self.get_object(pk)
        if not anotacion:
            return Response(
                {"error": "Anotación no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        anotacion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ REUNIONES ============
class ReunioneList(APIView, MongoObjectIdMixin):
    """Listar reuniones o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")

        reuniones = Reunione.find(query, sort=[("fecha", 1)])
        serializer = ReunioneSerializer(reuniones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReunioneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReunioneDetail(APIView, MongoObjectIdMixin):
    """Detalle de reunion"""

    def get_object(self, pk):
        return Reunione.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ReunioneSerializer(reunion)
        return Response(serializer.data)

    def put(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ReunioneSerializer(reunion, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        reunion = self.get_object(pk)
        if not reunion:
            return Response(
                {"error": "Reunión no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )
        reunion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ APODERADOS ============
class ApoderadoList(APIView, MongoObjectIdMixin):
    """Listar apoderados o crear nuevo"""

    def get(self, request):
        query = {}

        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")

        apoderados = Apoderado.find(query, sort=[("apellido", 1)])
        serializer = ApoderadoSerializer(apoderados, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ApoderadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApoderadoDetail(APIView, MongoObjectIdMixin):
    """Detalle de apoderado"""

    def get_object(self, pk):
        return Apoderado.find_one({"_id": ObjectId(pk)})

    def get(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ApoderadoSerializer(apoderado)
        return Response(serializer.data)

    def put(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ApoderadoSerializer(apoderado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        apoderado = self.get_object(pk)
        if not apoderado:
            return Response(
                {"error": "Apoderado no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        apoderado.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ DASHBOARD ============
@api_view(["GET"])
def dashboard_docente(request):
    """Dashboard para docente"""
    docente_id = request.query_params.get("docente_id")

    if not docente_id:
        return Response(
            {"error": "docente_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Aquí puedes agregar lógica para obtener datos del dashboard
    # Por ejemplo: total estudiantes, asistencia hoy, evaluaciones próximas, etc.

    return Response({"message": "Dashboard docente - implementa la lógica aquí"})


@api_view(["GET"])
def dashboard_apoderado(request):
    """Dashboard para apoderado"""
    estudiante_id = request.query_params.get("estudiante_id")

    if not estudiante_id:
        return Response(
            {"error": "estudiante_id requerido"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Obtener datos del estudiante
    estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
    if not estudiante:
        return Response(
            {"error": "Estudiante no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Obtener asistencia reciente
    asistencia = Asistencia.find(
        {"estudiante_id": estudiante_id}, limit=10, sort=[("fecha", -1)]
    )

    # Obtener evaluaciones próximas
    curso_id = estudiante.curso_id
    evaluaciones = Evaluacion.find({"curso_id": curso_id}, limit=5, sort=[("fecha", 1)])

    # Obtener anotaciones
    anotaciones = Anotacion.find(
        {"estudiante_id": estudiante_id}, limit=5, sort=[("fecha", -1)]
    )

    return Response(
        {
            "estudiante": EstudianteSerializer(estudiante).data,
            "asistencia": AsistenciaSerializer(asistencia, many=True).data,
            "evaluaciones": EvaluacionSerializer(evaluaciones, many=True).data,
            "anotaciones": AnotacionSerializer(anotaciones, many=True).data,
        }
    )
