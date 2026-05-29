"""
Vistas/ViewSets para el Inspector General
Implementa los endpoints del módulo de inspectoría
"""

import json
from datetime import datetime, timedelta

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from bson import ObjectId

from .models import (
    Usuario, Estudiante, Curso, Asistencia,
    DocumentoGenerado, AccidenteEscolar, RetiroAlumno,
    LibroInspectoria, ConfiguracionEstablecimiento,
)
from .serializers import (
    UsuarioSerializer, EstudianteSerializer, CursoSerializer, AsistenciaSerializer,
    DocumentoGeneradoSerializer, AccidenteEscolarSerializer,
    RetiroAlumnoSerializer, LibroInspectoriaSerializer,
    ConfiguracionEstablecimientoSerializer,
)


class MongoObjectIdMixin:
    """Mixin para convertir ObjectIds de MongoDB"""

    def _convert_object_ids(self, data):
        """Convierte string IDs a ObjectId para consultas"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key in ["_id", "id", "estudiante_id", "curso_id", "apoderado_id", "inspector_id"]:
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


# ============================================================
# DOCUMENTOS GENERADOS
# ============================================================

class DocumentoGeneradoList(APIView, MongoObjectIdMixin):
    """Listar documentos o crear nuevo"""

    def get(self, request):
        query = {}
        if request.query_params.get("inspector_id"):
            query["inspector_id"] = request.query_params.get("inspector_id")
        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("tipo_documento"):
            query["tipo_documento"] = request.query_params.get("tipo_documento")

        docs = DocumentoGenerado.find(query, sort=[("fecha_emision", -1)])
        serializer = DocumentoGeneradoSerializer(docs, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data["fecha_emision"] = datetime.now().isoformat()
        serializer = DocumentoGeneradoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentoGeneradoDetail(APIView, MongoObjectIdMixin):
    """Detalle de un documento"""

    def get(self, request, pk):
        doc = DocumentoGenerado.find_one({"_id": ObjectId(pk)})
        if not doc:
            return Response({"error": "Documento no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DocumentoGeneradoSerializer(doc)
        return Response(serializer.data)


# ============================================================
# CERTIFICADOS PDF
# ============================================================

@api_view(["POST"])
def generar_certificado_alumno_regular(request):
    """Genera PDF de Certificado de Alumno Regular y lo registra"""
    estudiante_id = request.data.get("estudiante_id")
    inspector_id = request.data.get("inspector_id")

    if not estudiante_id or not inspector_id:
        return Response(
            {"error": "estudiante_id e inspector_id requeridos"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Obtener datos
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        inspector = Usuario.find_one({"_id": ObjectId(inspector_id)})
        establecimiento = _get_establecimiento_config()

        if not estudiante or not inspector:
            return Response({"error": "Estudiante o inspector no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Enriquecer datos del estudiante con el nombre del curso
        if estudiante.curso_id:
            curso = Curso.find_one({"_id": ObjectId(estudiante.curso_id)})
            if curso:
                estudiante.curso_nombre = f"{curso.nivel} {curso.nombre}"

        # Generar PDF
        from .pdf_generator import generar_certificado_alumno_regular as generar_pdf
        pdf_buffer = generar_pdf(
            estudiante.to_dict(),
            establecimiento,
            inspector.to_dict(),
        )

        # Registrar en documentos_generados
        doc = DocumentoGenerado({
            "tipo_documento": "certificado_alumno_regular",
            "estudiante_id": estudiante_id,
            "inspector_id": inspector_id,
            "fecha_emision": datetime.now().isoformat(),
            "datos_adicionales": {"nombre_estudiante": f"{estudiante.nombre} {estudiante.apellido}"},
            "estado": "emitido",
        })
        doc.save()

        return Response({
            "success": True,
            "message": "Certificado generado correctamente",
            "documento_id": doc._id,
            "pdf_base64": _buffer_to_base64(pdf_buffer),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def generar_certificado_notas(request):
    """Genera PDF de Certificado de Notas"""
    estudiante_id = request.data.get("estudiante_id")
    inspector_id = request.data.get("inspector_id")
    ano_escolar = request.data.get("ano_escolar", datetime.now().year)

    if not estudiante_id or not inspector_id:
        return Response(
            {"error": "estudiante_id e inspector_id requeridos"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        inspector = Usuario.find_one({"_id": ObjectId(inspector_id)})
        establecimiento = _get_establecimiento_config()

        if not estudiante or not inspector:
            return Response({"error": "Estudiante o inspector no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Obtener notas del estudiante
        from .models import Nota
        notas = Nota.find({
            "estudiante_id": estudiante_id,
            "ano_escolar": int(ano_escolar),
        })

        notas_serializadas = [n.to_dict() for n in notas]

        # Enriquecer con nombre del curso
        if estudiante.curso_id:
            curso = Curso.find_one({"_id": ObjectId(estudiante.curso_id)})
            if curso:
                estudiante.curso_nombre = f"{curso.nivel} {curso.nombre}"

        # Generar PDF
        from .pdf_generator import generar_certificado_notas as generar_pdf
        pdf_buffer = generar_pdf(
            estudiante.to_dict(),
            notas_serializadas,
            establecimiento,
            inspector.to_dict(),
            ano_escolar,
        )

        # Registrar documento
        doc = DocumentoGenerado({
            "tipo_documento": "certificado_notas",
            "estudiante_id": estudiante_id,
            "inspector_id": inspector_id,
            "fecha_emision": datetime.now().isoformat(),
            "datos_adicionales": {
                "nombre_estudiante": f"{estudiante.nombre} {estudiante.apellido}",
                "ano_escolar": ano_escolar,
            },
            "estado": "emitido",
        })
        doc.save()

        return Response({
            "success": True,
            "message": "Certificado de notas generado correctamente",
            "documento_id": doc._id,
            "pdf_base64": _buffer_to_base64(pdf_buffer),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def generar_autorizacion_retiro(request):
    """Genera PDF de Autorización de Retiro y guarda el registro"""
    estudiante_id = request.data.get("estudiante_id")
    inspector_id = request.data.get("inspector_id")
    apoderado_autorizante = request.data.get("apoderado_autorizante")
    motivo = request.data.get("motivo")
    fecha = request.data.get("fecha")
    hora_salida = request.data.get("hora_salida")
    observacion = request.data.get("observacion", "")

    if not all([estudiante_id, inspector_id, apoderado_autorizante, motivo, fecha, hora_salida]):
        return Response(
            {"error": "Todos los campos requeridos: estudiante_id, inspector_id, apoderado_autorizante, motivo, fecha, hora_salida"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        inspector = Usuario.find_one({"_id": ObjectId(inspector_id)})
        establecimiento = _get_establecimiento_config()

        if not estudiante or not inspector:
            return Response({"error": "Estudiante o inspector no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Enriquecer estudiante
        if estudiante.curso_id:
            curso = Curso.find_one({"_id": ObjectId(estudiante.curso_id)})
            if curso:
                estudiante.curso_nombre = f"{curso.nivel} {curso.nombre}"

        retiro_data = {
            "apoderado_autorizante": apoderado_autorizante,
            "motivo": motivo,
            "fecha": fecha,
            "hora_salida": hora_salida,
        }

        # Guardar retiro
        retiro = RetiroAlumno({
            "estudiante_id": estudiante_id,
            "apoderado_autorizante": apoderado_autorizante,
            "motivo": motivo,
            "fecha": fecha,
            "hora_salida": hora_salida,
            "inspector_id": inspector_id,
            "observacion": observacion,
        })
        retiro.save()

        # Generar PDF
        from .pdf_generator import generar_autorizacion_retiro as generar_pdf
        pdf_buffer = generar_pdf(
            estudiante.to_dict(),
            retiro_data,
            establecimiento,
            inspector.to_dict(),
        )

        # Registrar en documentos_generados
        doc = DocumentoGenerado({
            "tipo_documento": "retiro_alumno",
            "estudiante_id": estudiante_id,
            "inspector_id": inspector_id,
            "fecha_emision": datetime.now().isoformat(),
            "datos_adicionales": {
                "motivo": motivo,
                "retiro_id": retiro._id,
            },
            "estado": "emitido",
        })
        doc.save()

        return Response({
            "success": True,
            "message": "Autorización de retiro generada correctamente",
            "retiro_id": retiro._id,
            "documento_id": doc._id,
            "pdf_base64": _buffer_to_base64(pdf_buffer),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def generar_declaracion_accidente(request):
    """Genera PDF de Declaración de Accidente Escolar y guarda el registro"""
    estudiante_id = request.data.get("estudiante_id")
    inspector_id = request.data.get("inspector_id")
    fecha_accidente = request.data.get("fecha_accidente")
    hora_accidente = request.data.get("hora_accidente")
    lugar = request.data.get("lugar")
    descripcion = request.data.get("descripcion")
    tipo_lesion = request.data.get("tipo_lesion")
    testigos = request.data.get("testigos", "")
    derivacion = request.data.get("derivacion", "")

    if not all([estudiante_id, inspector_id, fecha_accidente, descripcion]):
        return Response(
            {"error": "Campos requeridos: estudiante_id, inspector_id, fecha_accidente, descripcion"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        estudiante = Estudiante.find_one({"_id": ObjectId(estudiante_id)})
        inspector = Usuario.find_one({"_id": ObjectId(inspector_id)})
        establecimiento = _get_establecimiento_config()

        if not estudiante or not inspector:
            return Response({"error": "Estudiante o inspector no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if estudiante.curso_id:
            curso = Curso.find_one({"_id": ObjectId(estudiante.curso_id)})
            if curso:
                estudiante.curso_nombre = f"{curso.nivel} {curso.nombre}"

        accidente_data = {
            "fecha_accidente": fecha_accidente,
            "hora_accidente": hora_accidente,
            "lugar": lugar,
            "descripcion": descripcion,
            "tipo_lesion": tipo_lesion,
            "testigos": testigos,
            "derivacion": derivacion,
        }

        # Guardar accidente
        accidente = AccidenteEscolar({
            "estudiante_id": estudiante_id,
            "fecha_accidente": fecha_accidente,
            "hora_accidente": hora_accidente,
            "lugar": lugar,
            "descripcion": descripcion,
            "tipo_lesion": tipo_lesion,
            "testigos": testigos,
            "inspector_id": inspector_id,
            "derivacion": derivacion,
            "estado": "derivado" if derivacion else "pendiente",
        })
        accidente.save()

        # Generar PDF
        from .pdf_generator import generar_declaracion_accidente as generar_pdf
        pdf_buffer = generar_pdf(
            estudiante.to_dict(),
            accidente_data,
            establecimiento,
            inspector.to_dict(),
        )

        # Registrar documento
        doc = DocumentoGenerado({
            "tipo_documento": "seguro_escolar",
            "estudiante_id": estudiante_id,
            "inspector_id": inspector_id,
            "fecha_emision": datetime.now().isoformat(),
            "datos_adicionales": {
                "accidente_id": accidente._id,
                "tipo_lesion": tipo_lesion,
            },
            "estado": "emitido",
        })
        doc.save()

        return Response({
            "success": True,
            "message": "Declaración de accidente generada correctamente",
            "accidente_id": accidente._id,
            "documento_id": doc._id,
            "pdf_base64": _buffer_to_base64(pdf_buffer),
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# RETIROS
# ============================================================

class RetiroList(APIView, MongoObjectIdMixin):
    """Listar retiros o crear nuevo"""

    def get(self, request):
        query = {}
        if request.query_params.get("fecha"):
            query["fecha"] = request.query_params.get("fecha")
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("inspector_id"):
            query["inspector_id"] = request.query_params.get("inspector_id")

        retiros = RetiroAlumno.find(query, sort=[("fecha", -1)])
        serializer = RetiroAlumnoSerializer(retiros, many=True)
        return Response(serializer.data)


class RetiroDetail(APIView, MongoObjectIdMixin):
    """Detalle de un retiro"""

    def get(self, request, pk):
        retiro = RetiroAlumno.find_one({"_id": ObjectId(pk)})
        if not retiro:
            return Response({"error": "Retiro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = RetiroAlumnoSerializer(retiro)
        return Response(serializer.data)

    def put(self, request, pk):
        retiro = RetiroAlumno.find_one({"_id": ObjectId(pk)})
        if not retiro:
            return Response({"error": "Retiro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = RetiroAlumnoSerializer(retiro, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        retiro = RetiroAlumno.find_one({"_id": ObjectId(pk)})
        if not retiro:
            return Response({"error": "Retiro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        retiro.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# ACCIDENTES ESCOLARES
# ============================================================

class AccidenteList(APIView, MongoObjectIdMixin):
    """Listar accidentes o crear nuevo"""

    def get(self, request):
        query = {}
        if request.query_params.get("estado"):
            query["estado"] = request.query_params.get("estado")
        if request.query_params.get("fecha"):
            query["fecha_accidente"] = request.query_params.get("fecha")
        if request.query_params.get("inspector_id"):
            query["inspector_id"] = request.query_params.get("inspector_id")

        accidentes = AccidenteEscolar.find(query, sort=[("fecha_accidente", -1)])
        serializer = AccidenteEscolarSerializer(accidentes, many=True)
        return Response(serializer.data)


class AccidenteDetail(APIView, MongoObjectIdMixin):
    """Detalle de un accidente"""

    def get(self, request, pk):
        accidente = AccidenteEscolar.find_one({"_id": ObjectId(pk)})
        if not accidente:
            return Response({"error": "Accidente no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AccidenteEscolarSerializer(accidente)
        return Response(serializer.data)

    def put(self, request, pk):
        accidente = AccidenteEscolar.find_one({"_id": ObjectId(pk)})
        if not accidente:
            return Response({"error": "Accidente no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = AccidenteEscolarSerializer(accidente, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        accidente = AccidenteEscolar.find_one({"_id": ObjectId(pk)})
        if not accidente:
            return Response({"error": "Accidente no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        accidente.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# LIBRO DE INSPECTORÍA
# ============================================================

class LibroInspectoriaList(APIView, MongoObjectIdMixin):
    """Listar registros del libro o crear nuevo"""

    def get(self, request):
        query = {}
        if request.query_params.get("fecha"):
            query["fecha"] = request.query_params.get("fecha")
        if request.query_params.get("curso_id"):
            query["curso_id"] = request.query_params.get("curso_id")
        if request.query_params.get("estudiante_id"):
            query["estudiante_id"] = request.query_params.get("estudiante_id")
        if request.query_params.get("tipo"):
            query["tipo"] = request.query_params.get("tipo")
        if request.query_params.get("inspector_id"):
            query["inspector_id"] = request.query_params.get("inspector_id")

        registros = LibroInspectoria.find(query, sort=[("fecha", -1)])
        serializer = LibroInspectoriaSerializer(registros, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LibroInspectoriaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LibroInspectoriaDetail(APIView, MongoObjectIdMixin):
    """Detalle de un registro del libro"""

    def get(self, request, pk):
        registro = LibroInspectoria.find_one({"_id": ObjectId(pk)})
        if not registro:
            return Response({"error": "Registro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LibroInspectoriaSerializer(registro)
        return Response(serializer.data)

    def put(self, request, pk):
        registro = LibroInspectoria.find_one({"_id": ObjectId(pk)})
        if not registro:
            return Response({"error": "Registro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LibroInspectoriaSerializer(registro, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        registro = LibroInspectoria.find_one({"_id": ObjectId(pk)})
        if not registro:
            return Response({"error": "Registro no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        registro.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# ASISTENCIA GENERAL (lectura)
# ============================================================

@api_view(["GET"])
def asistencia_general(request):
    """Vista consolidada de asistencia por curso y fecha"""
    fecha = request.query_params.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    curso_id = request.query_params.get("curso_id")

    query = {"fecha": fecha}
    if curso_id:
        query["curso_id"] = curso_id

    registros = Asistencia.find(query, sort=[("curso_id", 1)])
    serializer = AsistenciaSerializer(registros, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def inasistencias_criticas(request):
    """
    Lista estudiantes con 3+ inasistencias consecutivas
    """
    try:
        # Tomar los últimos 30 días
        treinta_dias_atras = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        # Obtener todas las asistencias del último mes
        asistencias = Asistencia.find({"fecha": {"$gte": treinta_dias_atras}})

        # Agrupar por estudiante y contar ausencias
        ausencias_por_estudiante = {}
        for a in asistencias:
            if not a.presente:
                eid = a.estudiante_id
                if eid not in ausencias_por_estudiante:
                    ausencias_por_estudiante[eid] = []
                ausencias_por_estudiante[eid].append(a)

        # Filtrar estudiantes con 3+ ausencias
        resultado = []
        for est_id, ausencias in ausencias_por_estudiante.items():
            if len(ausencias) >= 3:
                estudiante = Estudiante.find_one({"_id": ObjectId(est_id)})
                if estudiante:
                    resultado.append({
                        "estudiante_id": est_id,
                        "nombre": f"{estudiante.nombre} {estudiante.apellido}",
                        "rut": estudiante.rut,
                        "curso_id": estudiante.curso_id,
                        "total_inasistencias": len(ausencias),
                        "ultimas_fechas": sorted([a.fecha for a in ausencias], reverse=True)[:5],
                    })

        return Response(resultado)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# CONFIGURACIÓN DEL ESTABLECIMIENTO
# ============================================================

class ConfiguracionEstablecimientoView(APIView, MongoObjectIdMixin):
    """Obtener o actualizar la configuración del establecimiento"""

    def get(self, request):
        configs = ConfiguracionEstablecimiento.find()
        if configs:
            serializer = ConfiguracionEstablecimientoSerializer(configs[0])
            return Response(serializer.data)
        # Si no hay configuración, devolver valores por defecto
        return Response({
            "nombre": "",
            "rut": "",
            "direccion": "",
            "telefono": "",
            "email": "",
            "director": "",
            "inspector_general": "",
            "logo_url": "",
            "codigo_sostenedor": "",
            "dependencia": "",
            "region": "",
            "comuna": "",
            "texto_certificado_regular": "",
            "texto_certificado_notas": "",
            "texto_autorizacion_retiro": "",
            "texto_declaracion_accidente": "",
        })

    def post(self, request):
        # Buscar si ya existe una configuración
        configs = ConfiguracionEstablecimiento.find()
        if configs:
            # Actualizar la existente
            config = configs[0]
            serializer = ConfiguracionEstablecimientoSerializer(config, data=request.data)
        else:
            # Crear nueva
            serializer = ConfiguracionEstablecimientoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# DASHBOARD DEL INSPECTOR GENERAL
# ============================================================

@api_view(["GET"])
def dashboard_inspector(request):
    """Dashboard consolidado para el Inspector General"""
    inspector_id = request.query_params.get("inspector_id")

    if not inspector_id:
        return Response(
            {"error": "inspector_id requerido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        hoy = datetime.now().strftime("%Y-%m-%d")
        inicio_mes = datetime.now().replace(day=1).strftime("%Y-%m-%d")

        # 1. Documentos emitidos hoy
        docs_hoy = DocumentoGenerado.count({"inspector_id": inspector_id, "fecha_emision": {"$regex": f"^{hoy}"}})

        # 2. Retiros autorizados hoy
        retiros_hoy = RetiroAlumno.count({"fecha": hoy})

        # 3. Accidentes del mes
        accidentes_mes = AccidenteEscolar.count({"fecha_accidente": {"$gte": inicio_mes}})
        accidentes_pendientes = AccidenteEscolar.count({"estado": "pendiente"})

        # 4. Obtener estudiantes con inasistencias críticas
        inasistencias_criticas = _obtener_inasistencias_criticas()

        # 5. Últimos documentos
        docs_recientes = DocumentoGenerado.find(
            {"inspector_id": inspector_id},
            limit=5,
            sort=[("fecha_emision", -1)],
        )
        docs_serialized = DocumentoGeneradoSerializer(docs_recientes, many=True).data

        # 6. Últimos retiros
        retiros_recientes = RetiroAlumno.find(limit=5, sort=[("fecha", -1)])
        retiros_serialized = RetiroAlumnoSerializer(retiros_recientes, many=True).data

        # 7. Últimos accidentes
        accidentes_recientes = AccidenteEscolar.find(limit=5, sort=[("fecha_accidente", -1)])
        accidentes_serialized = AccidenteEscolarSerializer(accidentes_recientes, many=True).data

        return Response({
            "documentos_hoy": docs_hoy,
            "retiros_hoy": retiros_hoy,
            "accidentes_mes": accidentes_mes,
            "accidentes_pendientes": accidentes_pendientes,
            "inasistencias_criticas": inasistencias_criticas,
            "documentos_recientes": docs_serialized,
            "retiros_recientes": retiros_serialized,
            "accidentes_recientes": accidentes_serialized,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _get_establecimiento_config():
    """Obtiene la configuración del establecimiento o valores por defecto"""
    configs = ConfiguracionEstablecimiento.find()
    if configs:
        return configs[0].to_dict()
    return {
        "nombre": "ESTABLECIMIENTO EDUCACIONAL",
        "rut": "",
        "direccion": "",
        "telefono": "",
        "email": "",
        "director": "",
        "inspector_general": "",
        "logo_url": "",
        "codigo_sostenedor": "",
        "dependencia": "",
        "region": "",
        "comuna": "Santiago",
        "texto_certificado_regular": "",
        "texto_certificado_notas": "",
        "texto_autorizacion_retiro": "",
        "texto_declaracion_accidente": "",
    }


def _obtener_inasistencias_criticas():
    """Obtiene lista de estudiantes con 3+ inasistencias"""
    try:
        treinta_dias = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        # Nota: No podemos usar $gte con string directamente en MongoDB en todos los casos
        asistencias = Asistencia.find({})
        ausencias_por_est = {}
        for a in asistencias:
            if not a.presente and a.fecha and a.fecha >= treinta_dias:
                eid = a.estudiante_id
                if eid not in ausencias_por_est:
                    ausencias_por_est[eid] = 0
                ausencias_por_est[eid] += 1

        resultado = []
        for est_id, total in ausencias_por_est.items():
            if total >= 3:
                estudiante = Estudiante.find_one({"_id": ObjectId(est_id)})
                if estudiante:
                    resultado.append({
                        "estudiante_id": est_id,
                        "nombre": f"{estudiante.nombre} {estudiante.apellido}",
                        "rut": estudiante.rut,
                        "total_inasistencias": total,
                    })
        return resultado
    except Exception:
        return []


def _buffer_to_base64(buffer):
    """Convierte un BytesIO a base64 para enviar por JSON"""
    import base64
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
