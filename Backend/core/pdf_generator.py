"""
Módulo de generación de PDFs para el Inspector General
Usa ReportLab + Pillow para crear documentos oficiales
Diseño profesional tipo carta con logo, highlight box y firma
"""

import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, PageBreak, Frame, PageTemplate
)

# ============================================================
# PALETA DE COLORES (del diseño HTML)
# ============================================================
COLOR_PRIMARY = HexColor("#1a365d")      # Azul oscuro institucional
COLOR_LIGHT_BG = HexColor("#f8fafc")     # Fondo muy claro para highlight
COLOR_BORDER = HexColor("#d3d3d3")       # Gris suave para bordes
COLOR_TEXT = HexColor("#333333")         # Texto principal
COLOR_LABEL = HexColor("#4a5568")        # Color para etiquetas
COLOR_VALUE = HexColor("#1a202c")        # Color para valores
COLOR_SUBTLE = HexColor("#718096")       # Texto secundario
COLOR_MUTED = HexColor("#a0aec0")        # Texto muy tenue

# ============================================================
# MÁRGENES
# ============================================================
MARGIN_LEFT = 2.5 * cm
MARGIN_RIGHT = 2.5 * cm
MARGIN_TOP = 2 * cm
MARGIN_BOTTOM = 2 * cm


# ============================================================
# ESTILOS
# ============================================================
def _get_estilos():
    """Estilos profesionales para documentos tipo carta"""
    estilos = getSampleStyleSheet()

    estilos.add(ParagraphStyle(
        "NombreInstitucion",
        parent=estilos["Normal"],
        fontSize=14,
        leading=17,
        textColor=COLOR_PRIMARY,
        fontName="Helvetica-Bold",
        alignment=TA_LEFT,
    ))

    estilos.add(ParagraphStyle(
        "DatosInstitucion",
        parent=estilos["Normal"],
        fontSize=9,
        leading=13,
        textColor=HexColor("#555555"),
        fontName="Helvetica",
        alignment=TA_LEFT,
    ))

    estilos.add(ParagraphStyle(
        "TituloDocumento",
        parent=estilos["Normal"],
        fontSize=17,
        leading=22,
        textColor=COLOR_PRIMARY,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceBefore=14,
        spaceAfter=14,
    ))

    estilos.add(ParagraphStyle(
        "CuerpoDocumento",
        parent=estilos["Normal"],
        fontSize=10,
        leading=16,
        textColor=COLOR_TEXT,
        fontName="Helvetica",
        alignment=TA_JUSTIFY,
        spaceBefore=8,
        spaceAfter=8,
    ))

    estilos.add(ParagraphStyle(
        "LabelHighlight",
        parent=estilos["Normal"],
        fontSize=10,
        leading=16,
        textColor=COLOR_LABEL,
        fontName="Helvetica-Bold",
    ))

    estilos.add(ParagraphStyle(
        "ValueHighlight",
        parent=estilos["Normal"],
        fontSize=10,
        leading=16,
        textColor=COLOR_VALUE,
        fontName="Helvetica",
    ))

    estilos.add(ParagraphStyle(
        "SubtituloDocumento",
        parent=estilos["Normal"],
        fontSize=11,
        leading=15,
        textColor=COLOR_PRIMARY,
        fontName="Helvetica",
        alignment=TA_CENTER,
        spaceBefore=0,
        spaceAfter=14,
    ))

    estilos.add(ParagraphStyle(
        "EtiquetaTabla",
        parent=estilos["Normal"],
        fontSize=10,
        leading=16,
        textColor=COLOR_LABEL,
        fontName="Helvetica-Bold",
    ))

    estilos.add(ParagraphStyle(
        "ValorTabla",
        parent=estilos["Normal"],
        fontSize=10,
        leading=16,
        textColor=COLOR_VALUE,
        fontName="Helvetica",
    ))

    estilos.add(ParagraphStyle(
        "FooterFecha",
        parent=estilos["Normal"],
        fontSize=9,
        leading=13,
        textColor=COLOR_SUBTLE,
        fontName="Helvetica",
        alignment=TA_LEFT,
    ))

    estilos.add(ParagraphStyle(
        "FirmaTexto",
        parent=estilos["Normal"],
        fontSize=9,
        leading=13,
        textColor=COLOR_SUBTLE,
        fontName="Helvetica",
        alignment=TA_CENTER,
    ))

    estilos.add(ParagraphStyle(
        "FirmaNombre",
        parent=estilos["Normal"],
        fontSize=10,
        leading=14,
        textColor=COLOR_VALUE,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
    ))

    estilos.add(ParagraphStyle(
        "PiePaginaTexto",
        parent=estilos["Normal"],
        fontSize=7,
        leading=9,
        textColor=COLOR_MUTED,
        fontName="Helvetica-Oblique",
        alignment=TA_CENTER,
    ))

    return estilos


# ============================================================
# LOGO
# ============================================================
def _obtener_logo(establecimiento, ancho=120, alto=120):
    """
    Obtiene el logo desde la URL configurada.
    Si falla o no hay URL, retorna None.
    """
    logo_url = establecimiento.get("logo_url", "").strip()
    if not logo_url:
        return None
    try:
        from urllib.request import urlopen
        img_data = urlopen(logo_url, timeout=5).read()
        logo = Image(BytesIO(img_data), width=ancho, height=alto)
        return logo
    except Exception:
        return None


# ============================================================
# ENCABEZADO INSTITUCIONAL (con logo)
# ============================================================
def _build_encabezado_con_logo(establecimiento, estilos):
    """
    Encabezado profesional:
      [Izquierda 65%] Nombre institución + datos
      [Derecha 35%]  Logo
      Línea fina inferior de separación
    """
    nombre = establecimiento.get("nombre", "ESTABLECIMIENTO EDUCACIONAL")
    rut = establecimiento.get("rut", "")
    direccion = establecimiento.get("direccion", "")
    comuna = establecimiento.get("comuna", "")
    telefono = establecimiento.get("telefono", "")
    email = establecimiento.get("email", "")

    # Info de la institución (columna izquierda)
    datos_html = f"<b>{nombre.upper()}</b><br/>"
    datos_html += f'<font size="9" color="#555555">'
    partes = []
    if rut:
        partes.append(f"RUT: {rut}")
    if direccion:
        dir_txt = direccion
        if comuna:
            dir_txt += f", {comuna}"
        partes.append(dir_txt)
    if telefono or email:
        partes.append(f"Tel: {telefono} / Email: {email}")
    datos_html += "<br/>".join(partes)
    datos_html += "</font>"

    left_cell = Paragraph(datos_html, estilos["NombreInstitucion"])

    # Logo (columna derecha)
    logo = _obtener_logo(establecimiento)
    if logo:
        right_cell = logo
    else:
        right_cell = Spacer(1, 10)

    # Tabla: 65% izquierda, 35% derecha
    tbl = Table(
        [[left_cell, right_cell]],
        colWidths=[11 * cm, 5 * cm],
    )
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))

    return tbl


def _build_separador():
    """Línea fina horizontal con color primario"""
    return HRFlowable(
        width="100%",
        thickness=1.5,
        color=COLOR_PRIMARY,
        spaceAfter=6,
        spaceBefore=0,
    )


# ============================================================
# HIGHLIGHT BOX (datos del estudiante)
# ============================================================
def _build_highlight_box(datos, estilos):
    """
    Crea un recuadro estilizado con:
      - Barra izquierda de color primario (4px)
      - Fondo gris muy claro
      - Filas de label: valor

    datos: list of [label, value] strings
    """
    if not datos:
        return Spacer(1, 1)

    rows = []
    for label, value in datos:
        label_p = Paragraph(f"<b>{label}</b>", estilos["LabelHighlight"])
        value_p = Paragraph(str(value) if value else "-", estilos["ValueHighlight"])
        rows.append([label_p, value_p])

    # Tabla interior: label | value
    inner = Table(rows, colWidths=[5 * cm, 10 * cm])
    inner.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 18),
        ("TEXTCOLOR", (0, 0), (0, -1), COLOR_LABEL),
        ("TEXTCOLOR", (1, 0), (1, -1), COLOR_VALUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (1, 0), (1, -1), 8),
    ]))

    # Envoltura con barra de color + fondo
    wrapper = Table([[inner]], colWidths=[15 * cm])
    wrapper.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), COLOR_LIGHT_BG),
        ("LEFTLINE", (0, 0), (0, 0), 4, COLOR_PRIMARY),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 0), (0, 0), 8),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 0),
    ]))

    return wrapper


# ============================================================
# TABLA DE DATOS SIMPLE (para accidente, retiro, etc.)
# ============================================================
def _build_tabla_datos(datos, estilos):
    """
    Tabla simple de dos columnas: label | value
    Sin fondo ni barra de color (para secciones de datos adicionales)

    datos: list of [label, value] strings
    """
    if not datos:
        return Spacer(1, 1)

    rows = []
    for label, value in datos:
        label_p = Paragraph(f"<b>{label}</b>", estilos["EtiquetaTabla"])
        value_p = Paragraph(str(value) if value else "-", estilos["ValorTabla"])
        rows.append([label_p, value_p])

    tbl = Table(rows, colWidths=[5 * cm, 10 * cm])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEADING", (0, 0), (-1, -1), 18),
        ("TEXTCOLOR", (0, 0), (0, -1), COLOR_LABEL),
        ("TEXTCOLOR", (1, 0), (1, -1), COLOR_VALUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (1, 0), (1, -1), 8),
    ]))
    return tbl


# ============================================================
# FOOTER CON FIRMA
# ============================================================
def _build_footer_firma(inspector, fecha_texto, ciudad, estilos):
    """
    Pie de documento estilo carta:
      [Izquierda] Fecha de emisión
      [Derecha]   Firma del inspector
    """
    left_html = (
        f"<b>Fecha de Emisión:</b><br/>"
        f"{fecha_texto}<br/>"
        f"{ciudad}."
    )
    left = Paragraph(left_html, estilos["FooterFecha"])

    right_html = (
        f"<br/><br/>"
        f"_________________________<br/>"
        f"<b>{inspector.get('nombre', '')} {inspector.get('apellido', '')}</b><br/>"
        f"<font size='9' color='#4a5568'>Inspector General<br/>"
        f"RUT: {inspector.get('rut', '')}</font>"
    )
    right = Paragraph(right_html, estilos["FirmaTexto"])

    tbl = Table([[left, right]], colWidths=[7.5 * cm, 7.5 * cm])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (0, 0), (0, 0), "LEFT"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 20),
    ]))
    return tbl


# ============================================================
# FIRMA DUAL (inspector + apoderado, lado a lado)
# ============================================================
def _build_dual_signature(inspector, apoderado, estilos):
    """
    Dos firmas lado a lado para retiro:
      [Izquierda] Inspector General
      [Derecha]   Apoderado
    """
    insp_html = (
        f"_________________________<br/>"
        f"<b>{inspector.get('nombre', '')} {inspector.get('apellido', '')}</b><br/>"
        f"<font size='9' color='#4a5568'>Inspector(a) General<br/>"
        f"RUT: {inspector.get('rut', '')}</font>"
    )
    apo_html = (
        f"_________________________<br/>"
        f"<b>{apoderado}</b><br/>"
        f"<font size='9' color='#4a5568'>Apoderado(a)</font>"
    )

    tbl = Table(
        [[Paragraph(insp_html, estilos["FirmaTexto"]),
          Paragraph(apo_html, estilos["FirmaTexto"])]],
        colWidths=[7.5 * cm, 7.5 * cm],
    )
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 30),
    ]))
    return tbl


# ============================================================
# PIE DE PÁGINA
# ============================================================
def _build_pie_pagina(canvas, doc):
    """Dibuja el pie de página genérico"""
    canvas.saveState()
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.setFillColor(COLOR_MUTED)
    canvas.drawCentredString(
        A4[0] / 2, 1.2 * cm,
        f"Documento generado por el sistema de gestión estudiantil - "
        f"{datetime.now().strftime('%d/%m/%Y %H:%M')}",
    )
    canvas.drawCentredString(
        A4[0] / 2, 0.8 * cm,
        f"Página {doc.page}",
    )
    canvas.restoreState()


# ============================================================
# VARIABLES Y TEXTOS CONFIGURABLES
# ============================================================
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


# ============================================================
# HELPERS COMUNES
# ============================================================
def _build_datos_estudiante_highlight(estudiante, estilos):
    """Construye el highlight box con datos del estudiante"""
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")
    datos = [
        ["Nombre del Alumno(a):", nombre_completo],
        ["RUT Estudiante:", estudiante.get("rut", "")],
        ["Curso:", curso_nombre],
    ]
    return _build_highlight_box(datos, estilos), nombre_completo, curso_nombre


def _formatear_fecha(fecha_str):
    """Convierte YYYY-MM-DD a DD-MM-YYYY para los documentos"""
    if not fecha_str:
        return ""
    try:
        fecha = datetime.strptime(fecha_str[:10], "%Y-%m-%d")
        return fecha.strftime("%d-%m-%Y")
    except (ValueError, TypeError):
        return fecha_str


def _build_fecha_emision():
    """Retorna fecha formateada para el pie del documento"""
    now = datetime.now()
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    dia = now.day
    mes = meses[now.month - 1]
    anio = now.year
    hora = now.strftime("%H:%M")
    return f"{dia} de {mes} de {anio}, {hora} hrs."


# ============================================================
# 1. CERTIFICADO DE ALUMNO REGULAR
# ============================================================
def generar_certificado_alumno_regular(estudiante, establecimiento, inspector):
    """
    Genera PDF de Certificado de Alumno Regular
    Diseño profesional tipo carta con logo, highlight box y firma
    """
    buffer = BytesIO()
    nombre_est = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}".strip()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title=f"Certificado de Alumno Regular - {nombre_est}",
        author=inspector.get('nombre', ''),
    )
    estilos = _get_estilos()
    elements = []

    # ---- ENCABEZADO ----
    elements.append(_build_encabezado_con_logo(establecimiento, estilos))
    elements.append(_build_separador())

    # ---- TÍTULO ----
    elements.append(Paragraph("CERTIFICADO DE ALUMNO REGULAR", estilos["TituloDocumento"]))

    # ---- DATOS DEL ESTUDIANTE ----
    box, nombre_completo, curso_nombre = _build_datos_estudiante_highlight(estudiante, estilos)
    elements.append(box)
    elements.append(Spacer(1, 8))

    # ---- AÑO LECTIVO (pequeña tabla después del highlight) ----
    ano_actual = datetime.now().year
    elements.append(_build_tabla_datos([["Año Lectivo:", str(ano_actual)]], estilos))
    elements.append(Spacer(1, 16))

    # ---- CUERPO DEL CERTIFICADO (configurable) ----
    ciudad = establecimiento.get("comuna", "Santiago")
    fecha_emision = _build_fecha_emision()

    texto_fijo = (
        f"La Dirección del establecimiento educacional <b>{establecimiento.get('nombre', '')}</b>, "
        f"debidamente facultada por la legislación educacional vigente, "
        f"certifica que el/la alumno/a <b>{nombre_completo}</b>, "
        f"RUT {estudiante.get('rut', '')}, se encuentra matriculado/a y cursando regularmente "
        f"<b>{curso_nombre}</b> en este establecimiento durante el año lectivo {ano_actual}."
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
    elements.append(Paragraph(texto_certificado, estilos["CuerpoDocumento"]))

    # ---- PÁRRAFO FINAL ----
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "Se extiende el presente certificado a petición del apoderado o interesado "
        "para los fines legales y administrativos que estime conveniente.",
        estilos["CuerpoDocumento"],
    ))

    # ---- FIRMA ----
    elements.append(Spacer(1, 10))
    elements.append(_build_footer_firma(inspector, fecha_emision, f"Cerro Navia, Santiago", estilos))

    # ---- BARRA DE CONTROL (opcional) ----
    elements.append(Spacer(1, 20))
    codigo = f"Código de Control: {estudiante.get('rut', '')[:4]}{datetime.now().strftime('%Y%m%d%H%M')}"
    elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceAfter=6))
    elements.append(Paragraph(codigo, estilos["PiePaginaTexto"]))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


# ============================================================
# 2. CERTIFICADO DE NOTAS
# ============================================================
def _build_tabla_notas(notas_por_asignatura):
    """Construye la tabla de notas con estilo profesional"""
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

    col_widths = [
        5.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm,
        1.5 * cm, 1.5 * cm, 1.5 * cm, 2 * cm,
    ]
    tbl_notas = Table(data_tabla, colWidths=col_widths, repeatRows=1)
    tbl_notas.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -2), 0.5, COLOR_BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, COLOR_PRIMARY),
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_LIGHT_BG),
        ("BACKGROUND", (0, -1), (-1, -1), COLOR_PRIMARY),
        ("TEXTCOLOR", (0, -1), (-1, -1), white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return tbl_notas, total_promedios


def generar_certificado_notas(estudiante, notas_por_asignatura, establecimiento, inspector, ano_escolar):
    """
    Genera PDF de Certificado de Notas
    Diseño profesional tipo carta con logo, highlight box, tabla y firma
    """
    buffer = BytesIO()
    nombre_est = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}".strip()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title=f"Certificado de Notas - {nombre_est}",
        author=inspector.get('nombre', ''),
    )
    estilos = _get_estilos()
    elements = []

    # ---- ENCABEZADO ----
    elements.append(_build_encabezado_con_logo(establecimiento, estilos))
    elements.append(_build_separador())

    # ---- TÍTULO ----
    elements.append(Paragraph("CERTIFICADO DE NOTAS", estilos["TituloDocumento"]))

    # ---- DATOS DEL ESTUDIANTE ----
    box, nombre_completo, curso_nombre = _build_datos_estudiante_highlight(estudiante, estilos)
    elements.append(box)
    elements.append(Spacer(1, 8))

    # ---- AÑO ESCOLAR ----
    elements.append(_build_tabla_datos([["Año Escolar:", str(ano_escolar)]], estilos))
    elements.append(Spacer(1, 16))

    # ---- CUERPO (configurable) ----
    ciudad = establecimiento.get("comuna", "Santiago")
    fecha_emision = _build_fecha_emision()

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
    elements.append(Spacer(1, 16))

    # ---- TABLA DE NOTAS ----
    tbl_notas, _ = _build_tabla_notas(notas_por_asignatura)
    elements.append(tbl_notas)

    # ---- PIE DE TABLA ----
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "Documento emitido electrónicamente. No reemplaza el informe oficial firmado.",
        estilos["PiePaginaTexto"],
    ))

    # ---- FIRMA ----
    elements.append(Spacer(1, 8))
    elements.append(_build_footer_firma(inspector, fecha_emision, f"Cerro Navia, Santiago", estilos))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


# ============================================================
# 3. AUTORIZACIÓN DE RETIRO
# ============================================================
def generar_autorizacion_retiro(estudiante, retiro_data, establecimiento, inspector):
    """
    Genera PDF de Autorización de Retiro de Alumno
    Diseño profesional tipo carta con logo, highlight box,
    cuerpo configurable, y firmas (inspector + apoderado)
    """
    buffer = BytesIO()
    nombre_est = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}".strip()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title=f"Autorización de Retiro - {nombre_est}",
        author=inspector.get('nombre', ''),
    )
    estilos = _get_estilos()
    elements = []

    # ---- ENCABEZADO ----
    elements.append(_build_encabezado_con_logo(establecimiento, estilos))
    elements.append(_build_separador())

    # ---- TÍTULO ----
    elements.append(Paragraph("AUTORIZACIÓN DE RETIRO DE ALUMNO", estilos["TituloDocumento"]))

    # ---- DATOS DEL ESTUDIANTE ----
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")
    observacion = retiro_data.get("observacion", "")

    datos_estudiante = [
        ["Nombre del Alumno(a):", nombre_completo],
        ["RUT Estudiante:", estudiante.get("rut", "")],
        ["Curso:", curso_nombre],
    ]
    elements.append(_build_highlight_box(datos_estudiante, estilos))
    elements.append(Spacer(1, 8))

    # ---- DATOS DEL RETIRO ----
    datos_retiro = [
        ["Apoderado que retira:", retiro_data.get("apoderado_autorizante", "")],
        ["Motivo del Retiro:", retiro_data.get("motivo", "")],
        ["Fecha del Retiro:", _formatear_fecha(retiro_data.get("fecha", ""))],
        ["Hora de Salida:", retiro_data.get("hora_salida", "")],
    ]
    if observacion:
        datos_retiro.append(["Observación:", observacion])

    elements.append(_build_tabla_datos(datos_retiro, estilos))
    elements.append(Spacer(1, 16))

    # ---- CUERPO (configurable) ----
    ciudad = establecimiento.get("comuna", "Santiago")
    fecha_emision = _build_fecha_emision()
    apoderado = retiro_data.get("apoderado_autorizante", "")

    texto_fijo = (
        f"Por medio del presente documento, se autoriza el retiro del/la alumno/a "
        f"<b>{nombre_completo}</b>, RUT {estudiante.get('rut', '')}, del curso {curso_nombre}, "
        f"del establecimiento educacional, por el motivo señalado anteriormente. "
        f"El/La apoderado/a <b>{apoderado}</b> se hace responsable "
        f"del/la alumno/a desde el momento de su retiro."
    )

    variables = {
        "nombre_alumno": f"<b>{nombre_completo}</b>",
        "rut_alumno": estudiante.get("rut", ""),
        "curso": curso_nombre,
        "apoderado": apoderado,
        "motivo": retiro_data.get("motivo", ""),
        "fecha_retiro": _formatear_fecha(retiro_data.get("fecha", "")),
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

    # ---- FIRMAS (Inspector + Apoderado) ----
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"Emitido en Cerro Navia, Santiago, el {fecha_emision}.",
        estilos["FooterFecha"],
    ))
    elements.append(_build_dual_signature(inspector, apoderado, estilos))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer


# ============================================================
# 4. DECLARACIÓN DE ACCIDENTE ESCOLAR
# ============================================================
def generar_declaracion_accidente(estudiante, accidente_data, establecimiento, inspector):
    """
    Genera PDF de Declaración de Accidente Escolar
    Diseño profesional tipo carta con logo, highlight box, datos del accidente y firma
    """
    buffer = BytesIO()
    nombre_est = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}".strip()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title=f"Declaración de Accidente Escolar - {nombre_est}",
        author=inspector.get('nombre', ''),
    )
    estilos = _get_estilos()
    elements = []

    # ---- ENCABEZADO ----
    elements.append(_build_encabezado_con_logo(establecimiento, estilos))
    elements.append(_build_separador())

    # ---- TÍTULO ----
    elements.append(Paragraph("DECLARACIÓN DE ACCIDENTE ESCOLAR", estilos["TituloDocumento"]))
    elements.append(Paragraph("Ley 16.744 - Seguro Escolar", estilos["SubtituloDocumento"]))

    # ---- DATOS DEL ESTUDIANTE ----
    nombre_completo = f"{estudiante.get('nombre', '')} {estudiante.get('apellido', '')}"
    curso_nombre = estudiante.get("curso_nombre", "")
    fecha_nac = estudiante.get("fecha_nacimiento", "")

    datos_est = [
        ["Nombre del Alumno(a):", nombre_completo],
        ["RUT Estudiante:", estudiante.get("rut", "")],
        ["Curso:", curso_nombre],
    ]
    if fecha_nac:
        datos_est.append(["Fecha de Nacimiento:", _formatear_fecha(str(fecha_nac))])

    elements.append(_build_highlight_box(datos_est, estilos))
    elements.append(Spacer(1, 8))

    # ---- CUERPO (configurable) ----
    ciudad = establecimiento.get("comuna", "Santiago")
    fecha_emision = _build_fecha_emision()

    texto_fijo = (
        f"Declaración de Accidente Escolar según lo dispuesto en la Ley 16.744 sobre Seguro Escolar. "
        f"Se deja constancia que el/la alumno/a <b>{nombre_completo}</b>, "
        f"RUT {estudiante.get('rut', '')}, del curso {curso_nombre}, "
        f"sufrió un accidente en las dependencias del establecimiento "
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
    elements.append(Spacer(1, 16))

    # ---- DATOS DEL ACCIDENTE ----
    datos_accidente = [
        ["Fecha del Accidente:", _formatear_fecha(accidente_data.get("fecha_accidente", ""))],
        ["Hora del Accidente:", accidente_data.get("hora_accidente", "")],
        ["Lugar:", accidente_data.get("lugar", "")],
        ["Descripción:", accidente_data.get("descripcion", "")],
        ["Tipo de Lesión:", accidente_data.get("tipo_lesion", "")],
        ["Testigos:", accidente_data.get("testigos", "")],
        ["Derivación:", accidente_data.get("derivacion", "No requiere")],
    ]

    elements.append(_build_tabla_datos(datos_accidente, estilos))

    # ---- FIRMA ----
    elements.append(Spacer(1, 10))
    elements.append(_build_footer_firma(inspector, fecha_emision, f"Cerro Navia, Santiago", estilos))

    doc.build(elements, onFirstPage=_build_pie_pagina, onLaterPages=_build_pie_pagina)
    buffer.seek(0)
    return buffer
