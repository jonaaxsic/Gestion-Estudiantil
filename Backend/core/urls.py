"""
URL Configuration for Backend API
"""

from django.urls import path
from . import views
from . import inspector_views

urlpatterns = [
    # Authentication
    path("auth/login/", views.login_view, name="login"),
    # Usuarios
    path("usuarios/", views.UsuarioList.as_view(), name="usuario-list"),
    path("usuarios/<str:pk>/", views.UsuarioDetail.as_view(), name="usuario-detail"),
    # Estudiantes
    path("estudiantes/", views.EstudianteList.as_view(), name="estudiante-list"),
    path(
        "estudiantes/<str:pk>/",
        views.EstudianteDetail.as_view(),
        name="estudiante-detail",
    ),
    # Cursos
    path("cursos/", views.CursoList.as_view(), name="curso-list"),
    path("cursos/<str:pk>/", views.CursoDetail.as_view(), name="curso-detail"),
    # Asistencia
    path("asistencia/", views.AsistenciaList.as_view(), name="asistencia-list"),
    path("asistencia/bulk/", views.AsistenciaBulk.as_view(), name="asistencia-bulk"),
    path(
        "asistencia/<str:pk>/",
        views.AsistenciaDetail.as_view(),
        name="asistencia-detail",
    ),
    # Evaluaciones
    path("evaluaciones/", views.EvaluacionList.as_view(), name="evaluacion-list"),
    path(
        "evaluaciones/<str:pk>/",
        views.EvaluacionDetail.as_view(),
        name="evaluacion-detail",
    ),
    # Anotaciones
    path("anotaciones/", views.AnotacionList.as_view(), name="anotacion-list"),
    path(
        "anotaciones/<str:pk>/",
        views.AnotacionDetail.as_view(),
        name="anotacion-detail",
    ),
    # Reuniones
    path("reuniones/", views.ReunioneList.as_view(), name="reunion-list"),
    path("reuniones/<str:pk>/", views.ReunioneDetail.as_view(), name="reunion-detail"),
    # Apoderados
    path("apoderados/", views.ApoderadoList.as_view(), name="apoderado-list"),
    path(
        "apoderados/<str:pk>/", views.ApoderadoDetail.as_view(), name="apoderado-detail"
    ),
    # Recordatorios
    path("recordatorios/", views.RecordatorioList.as_view(), name="recordatorio-list"),
    path(
        "recordatorios/<str:pk>/",
        views.RecordatorioDetail.as_view(),
        name="recordatorio-detail",
    ),
    # Asignaciones Docente
    path(
        "asignaciones-docente/",
        views.AsignacionDocenteList.as_view(),
        name="asignacion-docente-list",
    ),
    path(
        "asignaciones-docente/<str:pk>/",
        views.AsignacionDocenteDetail.as_view(),
        name="asignacion-docente-detail",
    ),
    # Cursos con asignaciones
    path(
        "cursos-con-asignaciones/",
        views.cursos_con_asignaciones,
        name="cursos-con-asignaciones",
    ),
    path("mis-cursos-docente/", views.mis_cursos_docente, name="mis-cursos-docente"),
    # Apoderados y Pupilos
    path(
        "estudiantes-apoderado/",
        views.estudiantes_apoderado,
        name="estudiantes-apoderado",
    ),
    path(
        "estudiantes-sin-apoderado/",
        views.estudiantes_sin_apoderado,
        name="estudiantes-sin-apoderado",
    ),
    # Dashboards
    path("dashboard/docente/", views.dashboard_docente, name="dashboard-docente"),
    path("dashboard/apoderado/", views.dashboard_apoderado, name="dashboard-apoderado"),
    # ============ MÓDULO INSPECTOR GENERAL ============
    # Dashboard
    path(
        "dashboard/inspector/",
        inspector_views.dashboard_inspector,
        name="dashboard-inspector",
    ),
    # Documentos
    path(
        "documentos/",
        inspector_views.DocumentoGeneradoList.as_view(),
        name="documento-list",
    ),
    path(
        "documentos",
        inspector_views.DocumentoGeneradoList.as_view(),
        name="documento-list-noslash",
    ),
    # IMPORTANTE: Rutas específicas SIEMPRE antes que <str:pk>
    # para evitar que Django capture "certificado-alumno-regular" como un pk
    path(
        "documentos/certificado-alumno-regular/",
        inspector_views.generar_certificado_alumno_regular,
        name="certificado-alumno-regular",
    ),
    path(
        "documentos/certificado-alumno-regular",
        inspector_views.generar_certificado_alumno_regular,
        name="certificado-alumno-regular-noslash",
    ),
    path(
        "documentos/certificado-notas/",
        inspector_views.generar_certificado_notas,
        name="certificado-notas",
    ),
    path(
        "documentos/certificado-notas",
        inspector_views.generar_certificado_notas,
        name="certificado-notas-noslash",
    ),
    path(
        "documentos/autorizacion-retiro/",
        inspector_views.generar_autorizacion_retiro,
        name="autorizacion-retiro",
    ),
    path(
        "documentos/autorizacion-retiro",
        inspector_views.generar_autorizacion_retiro,
        name="autorizacion-retiro-noslash",
    ),
    path(
        "documentos/accidente-escolar/",
        inspector_views.generar_declaracion_accidente,
        name="accidente-escolar",
    ),
    path(
        "documentos/accidente-escolar",
        inspector_views.generar_declaracion_accidente,
        name="accidente-escolar-noslash",
    ),
    path(
        "documentos/<str:pk>/regenerar-pdf/",
        inspector_views.regenerar_pdf_documento,
        name="documento-regenerar-pdf",
    ),
    path(
        "documentos/<str:pk>/regenerar-pdf",
        inspector_views.regenerar_pdf_documento,
        name="documento-regenerar-pdf-noslash",
    ),
    path(
        "documentos/<str:pk>/",
        inspector_views.DocumentoGeneradoDetail.as_view(),
        name="documento-detail",
    ),
    path(
        "documentos/<str:pk>",
        inspector_views.DocumentoGeneradoDetail.as_view(),
        name="documento-detail-noslash",
    ),
    # Retiros
    path(
        "retiros/",
        inspector_views.RetiroList.as_view(),
        name="retiro-list",
    ),
    path(
        "retiros/<str:pk>/",
        inspector_views.RetiroDetail.as_view(),
        name="retiro-detail",
    ),
    # Accidentes
    path(
        "accidentes/",
        inspector_views.AccidenteList.as_view(),
        name="accidente-list",
    ),
    path(
        "accidentes/<str:pk>/",
        inspector_views.AccidenteDetail.as_view(),
        name="accidente-detail",
    ),
    # Libro de Inspectoría
    path(
        "libro-inspectoria/",
        inspector_views.LibroInspectoriaList.as_view(),
        name="libro-inspectoria-list",
    ),
    path(
        "libro-inspectoria/<str:pk>/",
        inspector_views.LibroInspectoriaDetail.as_view(),
        name="libro-inspectoria-detail",
    ),
    # Asistencia General (lectura)
    path(
        "asistencia-general/",
        inspector_views.asistencia_general,
        name="asistencia-general",
    ),
    path(
        "inasistencias-criticas/",
        inspector_views.inasistencias_criticas,
        name="inasistencias-criticas",
    ),
    # Configuración del establecimiento
    path(
        "configuracion-establecimiento/",
        inspector_views.ConfiguracionEstablecimientoView.as_view(),
        name="configuracion-establecimiento",
    ),
]
