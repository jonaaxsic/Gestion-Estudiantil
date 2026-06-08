"""
URL Configuration for Backend API
Simple and clean endpoints - no admin, no docs complications
"""

from django.urls import include, path, re_path
from django.http import JsonResponse
from core import views, inspector_views, auth_views


def api_root(request):
    """Endpoint raíz del API"""
    return JsonResponse({"status": "ok", "message": "Servidor backend corriendo"})


def health_check(request):
    """Endpoint de health check para servicios de ping (cron-job.org)
    Ligero y rápido para evitar que el servidor se duerma"""
    from core.database import is_connected

    mongo_status = "connected" if is_connected() else "disconnected"
    return JsonResponse(
        {
            "status": "ok",
            "mongo": mongo_status,
            "timestamp": str(datetime.now().isoformat()),
        }
    )


from datetime import datetime

urlpatterns = [
    path("", api_root, name="api-root"),
    path("health", health_check, name="health-check"),  # Health check para ping
    # Authentication
    path("auth/login", views.login_view, name="login"),
    path("auth/create-test-user", views.create_test_user, name="create-test-user"),
    # Recuperación de contraseña
    path("auth/forgot-password", auth_views.forgot_password, name="forgot-password"),
    path("auth/verify-reset-code", auth_views.verify_reset_code, name="verify-reset-code"),
    path("auth/reset-password", auth_views.reset_password, name="reset-password"),
    # CRUD endpoints - con y sin trailing slash
    path("usuarios", views.UsuarioList.as_view(), name="usuario-list"),
    path("usuarios/", views.UsuarioList.as_view(), name="usuario-list-slash"),
    path("usuarios/<str:pk>", views.UsuarioDetail.as_view(), name="usuario-detail"),
    path(
        "usuarios/<str:pk>/", views.UsuarioDetail.as_view(), name="usuario-detail-slash"
    ),
    path("estudiantes", views.EstudianteList.as_view(), name="estudiante-list"),
    path("estudiantes/", views.EstudianteList.as_view(), name="estudiante-list-slash"),
    path(
        "estudiantes/<str:pk>",
        views.EstudianteDetail.as_view(),
        name="estudiante-detail",
    ),
    path("cursos", views.CursoList.as_view(), name="curso-list"),
    path("cursos/", views.CursoList.as_view(), name="curso-list-slash"),
    path("cursos/<str:pk>", views.CursoDetail.as_view(), name="curso-detail"),
    path("cursos/<str:pk>/", views.CursoDetail.as_view(), name="curso-detail-slash"),
    path("asistencia", views.AsistenciaList.as_view(), name="asistencia-list"),
    path("asistencia/", views.AsistenciaList.as_view(), name="asistencia-list-slash"),
    path("asistencia/bulk", views.AsistenciaBulk.as_view(), name="asistencia-bulk"),
    path(
        "asistencia/<str:pk>",
        views.AsistenciaDetail.as_view(),
        name="asistencia-detail",
    ),
    path("evaluaciones", views.EvaluacionList.as_view(), name="evaluacion-list"),
    path("evaluaciones/", views.EvaluacionList.as_view(), name="evaluacion-list-slash"),
    path(
        "evaluaciones/<str:pk>",
        views.EvaluacionDetail.as_view(),
        name="evaluacion-detail",
    ),
    path("anotaciones", views.AnotacionList.as_view(), name="anotacion-list"),
    path("anotaciones/", views.AnotacionList.as_view(), name="anotacion-list-slash"),
    path(
        "anotaciones/<str:pk>", views.AnotacionDetail.as_view(), name="anotacion-detail"
    ),
    path("reuniones", views.ReunioneList.as_view(), name="reunion-list"),
    path("reuniones/", views.ReunioneList.as_view(), name="reunion-list-slash"),
    path("reuniones/<str:pk>", views.ReunioneDetail.as_view(), name="reunion-detail"),
    path("apoderados", views.ApoderadoList.as_view(), name="apoderado-list"),
    path("apoderados/", views.ApoderadoList.as_view(), name="apoderado-list-slash"),
    path(
        "apoderados/<str:pk>", views.ApoderadoDetail.as_view(), name="apoderado-detail"
    ),
    # Dashboards
    path("dashboard/docente", views.dashboard_docente, name="dashboard-docente"),
    path("dashboard/apoderado", views.dashboard_apoderado, name="dashboard-apoderado"),
    # Registro público de apoderados
    path("auth/registro", views.registro_apoderado, name="registro-apoderado"),
    path(
        "estudiantes/sin-apoderado",
        views.estudiantes_sin_apoderado,
        name="estudiantes-sin-apoderado",
    ),
    # Notas - rutas específicas primero, luego la genérica
    path("notas", views.NotaList.as_view(), name="nota-list"),
    path("notas/", views.NotaList.as_view(), name="nota-list-slash"),
    path("notas/cerrar", views.cerrar_ramo, name="cerrar-ramo"),
    path("notas/actualizar", views.actualizar_nota_simple, name="actualizar-nota"),
    path("notas/<str:pk>", views.NotaDetail.as_view(), name="nota-detail"),
    # Recordatorios
    path("recordatorios", views.RecordatorioList.as_view(), name="recordatorio-list"),
    path(
        "recordatorios/",
        views.RecordatorioList.as_view(),
        name="recordatorio-list-slash",
    ),
    path(
        "recordatorios/<str:pk>",
        views.RecordatorioDetail.as_view(),
        name="recordatorio-detail",
    ),
    # Asignaciones Docente
    path(
        "asignaciones-docente",
        views.AsignacionDocenteList.as_view(),
        name="asignacion-docente-list",
    ),
    path(
        "asignaciones-docente/",
        views.AsignacionDocenteList.as_view(),
        name="asignacion-docente-list-slash",
    ),
    path(
        "asignaciones-docente/<str:pk>",
        views.AsignacionDocenteDetail.as_view(),
        name="asignacion-docente-detail",
    ),
    path(
        "asignaciones-docente/<str:pk>/",
        views.AsignacionDocenteDetail.as_view(),
        name="asignacion-docente-detail-slash",
    ),
    # Cursos con asignaciones (para dashboard docente)
    path(
        "cursos-con-asignaciones",
        views.cursos_con_asignaciones,
        name="cursos-con-asignaciones",
    ),
    # ============ MÓDULO INSPECTOR GENERAL ============
    # IMPORTANTE: Rutas específicas SIEMPRE antes que rutas con <str:pk>
    # para evitar que Django capture nombres como "certificado-alumno-regular" como un pk.
    path("dashboard/inspector", inspector_views.dashboard_inspector, name="dashboard-inspector"),
    # Documentos - rutas específicas primero (con y sin slash, igual que el resto)
    path("documentos/", inspector_views.DocumentoGeneradoList.as_view(), name="documento-list"),
    path("documentos", inspector_views.DocumentoGeneradoList.as_view(), name="documento-list-noslash"),
    path("documentos/certificado-alumno-regular/", inspector_views.generar_certificado_alumno_regular, name="certificado-alumno-regular"),
    path("documentos/certificado-alumno-regular", inspector_views.generar_certificado_alumno_regular, name="certificado-alumno-regular-noslash"),
    path("documentos/certificado-notas/", inspector_views.generar_certificado_notas, name="certificado-notas"),
    path("documentos/certificado-notas", inspector_views.generar_certificado_notas, name="certificado-notas-noslash"),
    path("documentos/autorizacion-retiro/", inspector_views.generar_autorizacion_retiro, name="autorizacion-retiro"),
    path("documentos/autorizacion-retiro", inspector_views.generar_autorizacion_retiro, name="autorizacion-retiro-noslash"),
    path("documentos/accidente-escolar/", inspector_views.generar_declaracion_accidente, name="accidente-escolar"),
    path("documentos/accidente-escolar", inspector_views.generar_declaracion_accidente, name="accidente-escolar-noslash"),
    path("documentos/<str:pk>/", inspector_views.DocumentoGeneradoDetail.as_view(), name="documento-detail"),
    path("documentos/<str:pk>", inspector_views.DocumentoGeneradoDetail.as_view(), name="documento-detail-noslash"),
    # Retiros
    path("retiros/", inspector_views.RetiroList.as_view(), name="retiro-list"),
    path("retiros/<str:pk>/", inspector_views.RetiroDetail.as_view(), name="retiro-detail"),
    # Accidentes
    path("accidentes/", inspector_views.AccidenteList.as_view(), name="accidente-list"),
    path("accidentes/<str:pk>/", inspector_views.AccidenteDetail.as_view(), name="accidente-detail"),
    # Libro Inspectoría
    path("libro-inspectoria/", inspector_views.LibroInspectoriaList.as_view(), name="libro-inspectoria-list"),
    path("libro-inspectoria/<str:pk>/", inspector_views.LibroInspectoriaDetail.as_view(), name="libro-inspectoria-detail"),
    # Asistencia, inasistencias, configuración
    path("asistencia-general/", inspector_views.asistencia_general, name="asistencia-general"),
    path("inasistencias-criticas/", inspector_views.inasistencias_criticas, name="inasistencias-criticas"),
    path("configuracion-establecimiento/", inspector_views.ConfiguracionEstablecimientoView.as_view(), name="configuracion-establecimiento"),
]
