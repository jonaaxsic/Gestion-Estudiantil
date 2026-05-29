"""
Módulo de generación de PDFs para el Inspector General
Usa ReportLab + Pillow para crear documentos oficiales
"""

import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, PageBreak, Frame, PageTemplate
)
from reportlab.platypus.flowables import HRFlowable

# Colores institucionales
COLOR_PRIMARY = HexColor("#1a237e")  # Azul oscuro
COLOR_SECONDARY = HexColor("#0d47a1")  # Azul medio
COLOR_ACCENT = HexColor("#1565c0")  # Azul claro
COLOR_LIGHT = HexColor("#e8eaf6")  # Azul muy claro
COLOR_BORDER = HexColor("#bdbdbd")  # Gris para bordes

# Margenes del documento
MARGIN_LEFT = 2.5 * cm
MARGIN_RIGHT = 2.5 * cm
MARGIN_TOP = 2 * cm
MARGIN_BOTTOM = 2 * cm


def _get_estilos():
    """Obtiene los estilos de párrafo para los documentos"""
    estilos = getSampleStyleSheet()

    estilos.add(ParagraphStyle(
        "TituloDocumento",
        parent=estilos["Title"],
        fontSize=16,
        leading=20,
        textColor=COLOR_PRIMARY,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    ))

    estilos.add(ParagraphStyle(
        "SubtituloDocumento",
        parent=estilos["Normal"],
        fontSize=10,
        leading=14,
        textColor=COLOR_SECONDARY,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))

    estilos.add(ParagraphStyle(
        "EncabezadoColegio",
        parent=estilos["Normal"],
        fontSize=11,
        leading=14,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    ))

    estilos.add(ParagraphStyle(
        "DatosColegio",
        parent=estilos["Normal"],
        fontSize=8,
        leading=10,
        textColor=COLOR_SECONDARY,
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))

    estilos.add(ParagraphStyle(
        "LabelDato",
        parent=estilos["Normal"],
        fontSize=10,
        leading=14,
        textColor=black,
        fontName="Helvetica-Bold",
        spaceBefore=4,
        spaceAfter=2,
    ))

    estilos.add(ParagraphStyle(
        "ValorDato",
        parent=estilos["Normal"],
        fontSize=10,
        leading=14,
        textColor=black,
        fontName="Helvetica",
        spaceBefore=2,
        spaceAfter=4,
        leftIndent=10,
    ))

    estilos.add(ParagraphStyle(
        "CuerpoDocumento",
        parent=estilos["Normal"],
        fontSize=10,
        leading=15,
        textColor=black,
        fontName="Helvetica",
        alignment=TA_JUSTIFY,
        spaceBefore=10,
        spaceAfter=10,
    ))

    estilos.add(ParagraphStyle(
        "FirmaTexto",
        parent=estilos["Normal"],
        fontSize=10,
        leading=14,
        textColor=black,
        fontName="Helvetica",
        alignment=TA_CENTER,
        spaceBefore=4,
        spaceAfter=2,
    ))

    estilos.add(ParagraphStyle(
        "PiePagina",
        parent=estilos["Normal"],
        fontSize=7,
        leading=9,
        textColor=grey,
        alignment=TA_CENTER,
        fontName="Helvetica-Oblique",
    ))

    return estilos


def _build_encabezado_colegio(establecimiento, estilos):
    """Construye el encabezado institucional del documento"""
    elements = []

    nombre = establecimiento.get("nombre", "ESTABLECIMIENTO EDUCACIONAL")
    rut = establecimiento.get("rut", "")
    direccion = establecimiento.get("direccion", "")
    telefono = establecimiento.get("telefono", "")
    email = establecimiento.get("email", "")

    elements.append(Paragraph(nombre.upper(), estilos["EncabezadoColegio"]))

    datos = []
    if rut:
        datos.append(f"RUT: {rut}")
    if direccion:
        datos.append(direccion)
    if telefono or email:
        datos.append(f"Tel: {telefono or ''} / Email: {email or ''}")
    for dato in datos:
        elements.append(Paragraph(dato, estilos["DatosColegio"]))

    elements.append(HRFlowable(
        width="100%", thickness=2, color=COLOR_PRIMARY,
        spaceAfter=10, spaceBefore=6
    ))

    return elements


def _build_pie_pagina(canvas, doc):
    """Dibuja el pie de página en cada página"""
    canvas.saveState()
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.setFillColor(grey)
    canvas.drawCentredString(
        A4[0] / 2, 1.2 * cm,
        f"Documento generado por el sistema de gestión estudiantil - {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    )
    # Número de página
    canvas.drawCentredString(
        A4[0] / 2, 0.8 * cm,
        f"Página {doc.page}"
    )
    canvas.restoreState()


def _build_linea_firma(estilos):
    """Construye la línea de firma"""
    elements = []
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="40%", thickness=1, color=black, spaceAfter=4))
    elements.append(Paragraph("Inspector General", estilos["FirmaTexto"]))
    elements.append(Spacer(1, 4))
    return elements


def _reemplazar_variables(texto, variables):
    """Reemplaza {variables} en un texto con sus valores"""
    for key, value in variables.items():
        texto = texto.replace(f"{{{key}}}", str(value) if value else "")
    return texto


def _obtener_texto_certificado(establecimiento, campo, variables, texto_fallback):
    """
    Obtiene texto configurable del establecimiento o usa fallback.
    Reemplaza variables como {nombre_alumno}, {rut_alumno}, etc.
    """
    texto_config = establecimiento.get(campo, "")
    if texto_config and texto_config.strip():
        return _reemplazar_variables(texto_config, variables)
    return texto_fallback


def _build_datos_estudiante(estudiante, estilos):
    """Construye tabla con datos del estudiante"""
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")

    datos = [
        ["NOMBRE DEL ALUMNO(A):", nombre_completo],
        ["RUT:", estudiante.get("rut", "")],
        ["CURSO:", curso_nombre],
    ]

    tbl = Table(datos, colWidths=[5 * cm, 10 * cm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl, nombre_completo, curso_nombre


def _build_firma_inspector(inspector, estilos):
    """Construye la linea de firma del inspector"""
    elements = []
    inspector_nombre = f"{inspector.get('nombre', '')} {inspector.get('apellido', '')}"
    elements.extend(_build_linea_firma(estilos))
    elements.append(Paragraph(inspector_nombre, estilos["FirmaTexto"]))
    elements.append(Paragraph(f"RUT: {inspector.get('rut', '')}", estilos["FirmaTexto"]))
    return elements


def generar_certificado_alumno_regular(estudiante, establecimiento, inspector):
    """
    Genera PDF de Certificado de Alumno Regular
    Usa texto configurable de configuracion_establecimiento si existe
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
    )
    estilos = _get_estilos()
    elements = []

    # Encabezado
    elements.extend(_build_encabezado_colegio(establecimiento, estilos))

    # Título
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("CERTIFICADO DE ALUMNO REGULAR", estilos["TituloDocumento"]))
    elements.append(Paragraph("(Artículo 5° Decreto N° 315/2024)", estilos["SubtituloDocumento"]))
    elements.append(Spacer(1, 10))

    # Línea divisoria
    elements.append(HRFlowable(width="60%", thickness=0.5, color=COLOR_BORDER, spaceAfter=15))

    # Datos del estudiante
    tbl, nombre_completo, curso_nombre = _build_datos_estudiante(estudiante, estilos)
    elements.append(tbl)
    elements.append(Spacer(1, 15))

    # Datos adicionales
    ano_actual = datetime.now().year
    datos_extra = [["AÑO LECTIVO:", str(ano_actual)]]
    tbl_extra = Table(datos_extra, colWidths=[5 * cm, 10 * cm])
    tbl_extra.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(tbl_extra)
    elements.append(Spacer(1, 20))

    # --- Cuerpo del certificado (configurable) ---
    ciudad = establecimiento.get("comuna", "Santiago")
    fecha_emision = datetime.now().strftime("%d de %B de %Y")

    texto_fijo = (
        f"El Director del establecimiento educacional {establecimiento.get('nombre', '')}, "
        f"RUT {establecimiento.get('rut', '')}, debidamente facultado por la legislación educacional vigente, "
        f"CERTIFICA que el/la alumno/a <b>{nombre_completo}</b>, RUT {estudiante.get('rut', '')}, "
        f"se encuentra matriculado/a y cursando regularmente <b>{curso_nombre}</b> "
        f"en este establecimiento durante el año lectivo {ano_actual}."
    )

    variables = {
        "nombre_alumno": f"<b>{nombre_completo}</b>",
        "rut_alumno": estudiante.get("rut", ""),
        "curso": curso_nombre,
        "anio_lectivo": str(ano_actual),
        "nombre_colegio": establecimiento.get("nombre", ""),
        "rut_colegio": establecimiento.get("rut", ""),
        "fecha_emision": fecha_emision,
        "ciudad": ciudad,
    }

    texto_certificado = _obtener_texto_certificado(
        establecimiento, "texto_certificado_regular", variables, texto_fijo
    )

    # Segundo párrafo fijo
    texto_segundo = (
        "Se extiende el presente certificado para los fines legales que el/la apoderado/a estime conveniente. "
        "No requiere timbre ni firma digital para su validez."
    )

    elements.append(Paragraph(texto_certificado, estilos["CuerpoDocumento"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(texto_segundo, estilos["CuerpoDocumento"]))
    elements.append(Spacer(1, 25))

    # Fecha y lugar de emisión
    now = datetime.now()
    elements.append(Paragraph(
        f"Emitido en {ciudad}, el {now.strftime('%d de %B de %Y')} a las {now.strftime('%H:%M')} horas.",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(
        f"Por {establecimiento.get('inspector_general', 'Inspectoría General')}",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 15))

    # Línea de firma
    elements.extend(_build_firma_inspector(inspector, estilos))

    # Construir PDF
    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


def _build_tabla_notas(notas_por_asignatura):
    """Construye la tabla de notas"""
    encabezados_tabla = ["Asignatura", "N1", "N2", "N3", "N4", "N5", "N6", "Prom."]
    data_tabla = [encabezados_tabla]
    total_promedios = []

    for item in notas_por_asignatura:
        notas = item.get("notas", {})
        fila = [item.get("asignatura", "")]
        for i in range(1, 7):
            val = notas.get(f"nota{i}")
            fila.append(str(val) if val is not None else "-")
        prom = item.get("nota_final", "-")
        fila.append(str(prom) if prom else "-")
        if prom:
            total_promedios.append(float(prom))
        data_tabla.append(fila)

    if total_promedios:
        prom_general = round(sum(total_promedios) / len(total_promedios), 1)
        data_tabla.append(["PROMEDIO GENERAL", "", "", "", "", "", "", str(prom_general)])

    col_widths = [5.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm, 2 * cm]
    tbl_notas = Table(data_tabla, colWidths=col_widths, repeatRows=1)
    tbl_notas.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_LIGHT),
        ("BACKGROUND", (0, -1), (-1, -1), COLOR_PRIMARY),
        ("TEXTCOLOR", (0, -1), (-1, -1), white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl_notas, total_promedios


def generar_certificado_notas(estudiante, notas_por_asignatura, establecimiento, inspector, ano_escolar):
    """
    Genera PDF de Certificado de Notas
    Usa texto configurable de configuracion_establecimiento si existe
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
    )
    estilos = _get_estilos()
    elements = []

    # Encabezado
    elements.extend(_build_encabezado_colegio(establecimiento, estilos))

    # Título
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("CERTIFICADO DE NOTAS", estilos["TituloDocumento"]))
    elements.append(Paragraph(f"Año Escolar {ano_escolar}", estilos["SubtituloDocumento"]))
    elements.append(Spacer(1, 10))

    # Línea divisoria
    elements.append(HRFlowable(width="60%", thickness=0.5, color=COLOR_BORDER, spaceAfter=15))

    # Datos del estudiante
    tbl, nombre_completo, curso_nombre = _build_datos_estudiante(estudiante, estilos)
    datos_extra = [["AÑO ESCOLAR:", str(ano_escolar)]]
    tbl_extra = Table(datos_extra, colWidths=[5 * cm, 10 * cm])
    tbl_extra.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(tbl)
    elements.append(Spacer(1, 5))
    elements.append(tbl_extra)
    elements.append(Spacer(1, 20))

    # --- Texto configurable ---
    ciudad = establecimiento.get("comuna", "Santiago")
    now = datetime.now()
    fecha_emision = now.strftime("%d de %B de %Y")

    texto_fijo = (
        f"El presente certificado de notas corresponde al rendimiento académico del/la alumno/a "
        f"<b>{nombre_completo}</b>, RUT {estudiante.get('rut', '')}, durante el año escolar "
        f"{ano_escolar} en el curso <b>{curso_nombre}</b>. Las calificaciones aquí detalladas "
        f"son las registradas oficialmente en el sistema de gestión del establecimiento."
    )

    variables = {
        "nombre_alumno": f"<b>{nombre_completo}</b>",
        "rut_alumno": estudiante.get("rut", ""),
        "curso": curso_nombre,
        "anio_escolar": str(ano_escolar),
        "nombre_colegio": establecimiento.get("nombre", ""),
        "rut_colegio": establecimiento.get("rut", ""),
        "fecha_emision": fecha_emision,
        "ciudad": ciudad,
    }

    texto_final = _obtener_texto_certificado(
        establecimiento, "texto_certificado_notas", variables, texto_fijo
    )
    elements.append(Paragraph(texto_final, estilos["CuerpoDocumento"]))
    elements.append(Spacer(1, 15))

    # --- Tabla de notas ---
    tbl_notas, _ = _build_tabla_notas(notas_por_asignatura)
    elements.append(tbl_notas)
    elements.append(Spacer(1, 25))

    # Nota al pie
    elements.append(Paragraph(
        "Este documento es emitido electrónicamente y puede ser validado en cualquier momento. "
        "No reemplaza el informe de notas oficial firmado por el Director.",
        estilos["PiePagina"]
    ))
    elements.append(Spacer(1, 15))

    # Fecha
    elements.append(Paragraph(
        f"Emitido en {ciudad}, el {now.strftime('%d de %B de %Y')} a las {now.strftime('%H:%M')} horas.",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(
        f"Por {establecimiento.get('inspector_general', 'Inspectoría General')}",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 15))

    # Firma
    elements.extend(_build_firma_inspector(inspector, estilos))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


def generar_autorizacion_retiro(estudiante, retiro_data, establecimiento, inspector):
    """
    Genera PDF de Autorización de Retiro de Alumno
    Usa texto configurable de configuracion_establecimiento si existe
    Incluye TODOS los datos del formulario (apoderado, motivo, fecha, hora, observacion)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
    )
    estilos = _get_estilos()
    elements = []

    # Encabezado
    elements.extend(_build_encabezado_colegio(establecimiento, estilos))

    # Título
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("AUTORIZACIÓN DE RETIRO DE ALUMNO", estilos["TituloDocumento"]))
    elements.append(Spacer(1, 10))

    elements.append(HRFlowable(width="60%", thickness=0.5, color=COLOR_BORDER, spaceAfter=15))

    # Datos
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")
    observacion = retiro_data.get("observacion", "")

    datos = [
        ["ESTUDIANTE:", nombre_completo],
        ["RUT ESTUDIANTE:", estudiante.get("rut", "")],
        ["CURSO:", curso_nombre],
        ["APODERADO QUE RETIRA:", retiro_data.get("apoderado_autorizante", "")],
        ["MOTIVO DEL RETIRO:", retiro_data.get("motivo", "")],
        ["FECHA DEL RETIRO:", retiro_data.get("fecha", "")],
        ["HORA DE SALIDA:", retiro_data.get("hora_salida", "")],
    ]

    if observacion:
        datos.append(["OBSERVACIÓN:", observacion])

    tbl = Table(datos, colWidths=[5 * cm, 10 * cm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 15))

    # --- Texto configurable ---
    ciudad = establecimiento.get("comuna", "Santiago")
    now = datetime.now()
    fecha_emision = now.strftime("%d de %B de %Y")
    apoderado = retiro_data.get("apoderado_autorizante", "")

    texto_fijo = (
        f"Por medio del presente documento, se autoriza el retiro del/la alumno/a "
        f"<b>{nombre_completo}</b>, RUT {estudiante.get('rut', '')}, del curso {curso_nombre}, "
        f"del establecimiento educacional, por el motivo señalado anteriormente. "
        f"El/La apoderado/a {apoderado} se hace responsable "
        "del alumno/a desde el momento de su retiro."
    )

    variables = {
        "nombre_alumno": f"<b>{nombre_completo}</b>",
        "rut_alumno": estudiante.get("rut", ""),
        "curso": curso_nombre,
        "apoderado": apoderado,
        "motivo": retiro_data.get("motivo", ""),
        "fecha_retiro": retiro_data.get("fecha", ""),
        "hora_salida": retiro_data.get("hora_salida", ""),
        "observacion": observacion,
        "nombre_colegio": establecimiento.get("nombre", ""),
        "rut_colegio": establecimiento.get("rut", ""),
        "fecha_emision": fecha_emision,
        "ciudad": ciudad,
    }

    texto_final = _obtener_texto_certificado(
        establecimiento, "texto_autorizacion_retiro", variables, texto_fijo
    )
    elements.append(Paragraph(texto_final, estilos["CuerpoDocumento"]))
    elements.append(Spacer(1, 5))

    # Hora de emisión
    elements.append(Paragraph(
        f"Emitido en {ciudad}, el {now.strftime('%d de %B de %Y')} a las {now.strftime('%H:%M')} horas.",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 20))

    # Firmas - tabla de firmas lado a lado
    firmas_data = [
        ["", ""],
        ["_________________________", "_________________________"],
        [f"{inspector.get('nombre', '')} {inspector.get('apellido', '')}", apoderado],
        ["Inspector(a) General", "Apoderado(a)"],
    ]

    tbl_firmas = Table(firmas_data, colWidths=[7.5 * cm, 7.5 * cm])
    tbl_firmas.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 2), (0, 2), "Helvetica-Bold"),
        ("FONTNAME", (1, 2), (1, 2), "Helvetica-Bold"),
        ("FONTNAME", (0, 3), (1, 3), "Helvetica"),
        ("FONTSIZE", (0, 3), (1, 3), 8),
        ("TEXTCOLOR", (0, 3), (1, 3), grey),
    ]))
    elements.append(tbl_firmas)

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


def generar_declaracion_accidente(estudiante, accidente_data, establecimiento, inspector):
    """
    Genera PDF de Declaración de Accidente Escolar (Ley 16.744)
    Usa texto configurable de configuracion_establecimiento si existe
    Incluye TODOS los datos del formulario (fecha, hora, lugar, descripcion, lesion, testigos, derivacion)
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
    )
    estilos = _get_estilos()
    elements = []

    # Encabezado
    elements.extend(_build_encabezado_colegio(establecimiento, estilos))

    # Título
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("DECLARACIÓN DE ACCIDENTE ESCOLAR", estilos["TituloDocumento"]))
    elements.append(Paragraph("Ley 16.744 - Seguro Escolar", estilos["SubtituloDocumento"]))
    elements.append(Spacer(1, 10))

    elements.append(HRFlowable(width="60%", thickness=0.5, color=COLOR_BORDER, spaceAfter=15))

    # Datos del estudiante
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")
    fecha_nac = estudiante.get("fecha_nacimiento", "")

    datos_estudiante = [
        ["DATOS DEL ACCIDENTADO", ""],
        ["Nombre:", nombre_completo],
        ["RUT:", estudiante.get("rut", "")],
        ["Curso:", curso_nombre],
        ["Fecha Nacimiento:", str(fecha_nac) if fecha_nac else ""],
    ]

    tbl_est = Table(datos_estudiante, colWidths=[4 * cm, 11 * cm])
    tbl_est.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_LIGHT),
    ]))
    elements.append(tbl_est)
    elements.append(Spacer(1, 15))

    # --- Texto configurable ---
    ciudad = establecimiento.get("comuna", "Santiago")
    now = datetime.now()
    fecha_emision = now.strftime("%d de %B de %Y")

    texto_fijo = (
        f"Declaración de Accidente Escolar según lo dispuesto en la Ley 16.744 sobre Seguro Escolar. "
        f"Se deja constancia que el/la alumno/a <b>{nombre_completo}</b>, RUT {estudiante.get('rut', '')}, "
        f"del curso {curso_nombre}, sufrió un accidente en las dependencias del establecimiento "
        f"o en actividades escolares, cuyos detalles se señalan a continuación."
    )

    variables = {
        "nombre_alumno": f"<b>{nombre_completo}</b>",
        "rut_alumno": estudiante.get("rut", ""),
        "curso": curso_nombre,
        "fecha_accidente": accidente_data.get("fecha_accidente", ""),
        "hora_accidente": accidente_data.get("hora_accidente", ""),
        "lugar": accidente_data.get("lugar", ""),
        "descripcion": accidente_data.get("descripcion", ""),
        "tipo_lesion": accidente_data.get("tipo_lesion", ""),
        "testigos": accidente_data.get("testigos", ""),
        "derivacion": accidente_data.get("derivacion", "No requiere"),
        "nombre_colegio": establecimiento.get("nombre", ""),
        "rut_colegio": establecimiento.get("rut", ""),
        "fecha_emision": fecha_emision,
        "ciudad": ciudad,
    }

    texto_final = _obtener_texto_certificado(
        establecimiento, "texto_declaracion_accidente", variables, texto_fijo
    )
    elements.append(Paragraph(texto_final, estilos["CuerpoDocumento"]))
    elements.append(Spacer(1, 15))

    # Datos del accidente (tabla detallada)
    datos_accidente = [
        ["DATOS DEL ACCIDENTE", ""],
        ["Fecha:", accidente_data.get("fecha_accidente", "")],
        ["Hora:", accidente_data.get("hora_accidente", "")],
        ["Lugar:", accidente_data.get("lugar", "")],
        ["Descripción:", accidente_data.get("descripcion", "")],
        ["Tipo de Lesión:", accidente_data.get("tipo_lesion", "")],
        ["Testigos:", accidente_data.get("testigos", "")],
        ["Derivación:", accidente_data.get("derivacion", "No requiere")],
    ]

    tbl_acc = Table(datos_accidente, colWidths=[4 * cm, 11 * cm])
    tbl_acc.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_LIGHT),
    ]))
    elements.append(tbl_acc)
    elements.append(Spacer(1, 20))

    # Fecha y hora de emisión
    elements.append(Paragraph(
        f"Emitido en {ciudad}, el {now.strftime('%d de %B de %Y')} a las {now.strftime('%H:%M')} horas.",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(
        f"Por {establecimiento.get('inspector_general', 'Inspectoría General')}",
        estilos["FirmaTexto"]
    ))
    elements.append(Spacer(1, 15))

    # Firma
    elements.extend(_build_firma_inspector(inspector, estilos))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer
