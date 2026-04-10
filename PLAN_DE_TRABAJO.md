# Plan de Trabajo – Gestión Estudiantil
**Fecha:** 09/04/2026  
**Autor:** Análisis técnico del sistema  
**Alcance:** Frontend Angular + Backend Django/Python  
**Entorno:** Producción en Cloudflare Pages + Render.com + MongoDB Atlas  

---

## ⚠️ IMPORTANTE: Principio de trabajo

Todas las correcciones se aplican **solo en el código fuente del Frontend (`Frontend/src/`) y del Backend (`Backend/`)**.  
No se toca la configuración de Cloudflare Pages, el Worker proxy (`functions/api.ts`), ni las variables de entorno de Render.  
Las conexiones Frontend ↔ Worker ↔ Backend ↔ MongoDB ya funcionan correctamente en producción.

---

## BLOQUE 1 – Errores Críticos de Backend (causas raíz de los fallos de guardado)

### BUG-001 — Typo en `ApoderadoSerializer.create()` → NameError en Python
**Archivo:** `Backend/core/serializers.py`, método `ApoderadoSerializer.create()`  
**Síntoma:** Cualquier operación que llame a este serializer falla con un error 500 interno.  
**Causa:** El código usa `apoderaDo` (camelCase incorrecto) en lugar de `apoderado`.

```python
# ❌ CÓDIGO ACTUAL (líneas ~247-251)
def create(self, validated_data):
    apoderado = Apoderado(validated_data)
    apoderaDo.save()        # <-- NameError: name 'apoderaDo' is not defined
    return apoderaDo        # <-- mismo error

# ✅ CORRECCIÓN
def create(self, validated_data):
    apoderado = Apoderado(validated_data)
    apoderado.save()
    return apoderado
```

**Impacto:** Bloquea el registro de apoderados desde el formulario público (`/registro`) y desde el panel admin.

---

### BUG-002 — Ruta duplicada en `urls.py` crea conflicto silencioso para Notas y Asistencia
**Archivo:** `Backend/urls.py`  
**Síntoma:** Las rutas `notas/cerrar` y `notas/actualizar` nunca son alcanzadas porque `notas/<str:pk>` las intercepta primero.  
**Causa:** Django evalúa las rutas en orden; `notas/<str:pk>` aparece antes que `notas/cerrar` y `notas/actualizar`.

```python
# ❌ ORDEN ACTUAL
path("notas/<str:pk>", views.NotaDetail.as_view(), ...),  # línea ~60
path("notas/cerrar", views.cerrar_ramo, ...),             # línea ~62 – NUNCA SE ALCANZA
path("notas/actualizar", views.actualizar_nota_simple, ...),  # NUNCA SE ALCANZA

# ✅ CORRECCIÓN – rutas específicas ANTES que las de parámetro
path("notas/cerrar", views.cerrar_ramo, ...),
path("notas/actualizar", views.actualizar_nota_simple, ...),
path("notas/<str:pk>", views.NotaDetail.as_view(), ...),
```

**Impacto:** `actualizarNotaSimple()` del frontend siempre recibe un 404 o 405. Las notas del docente nunca se guardan.

---

### BUG-003 — Las vistas `NotaList` y `NotaDetail` no están registradas en `urls.py`
**Archivo:** `Backend/urls.py`  
**Síntoma:** GET `/notas` devuelve 404.  
**Causa:** Las clases `NotaList` y `NotaDetail` existen en `views.py` pero **no tienen ruta asignada** en `urls.py`.

```python
# ✅ AGREGAR en urls.py
path("notas", views.NotaList.as_view(), name="nota-list"),
path("notas/", views.NotaList.as_view(), name="nota-list-slash"),
path("notas/cerrar", views.cerrar_ramo, name="cerrar-ramo"),
path("notas/actualizar", views.actualizar_nota_simple, name="actualizar-nota"),
path("notas/<str:pk>", views.NotaDetail.as_view(), name="nota-detail"),
```

**Impacto:** El panel de apoderado no puede mostrar calificaciones. El docente no puede guardar notas.

---

### BUG-004 — `RecordatorioSerializer`: campo `fecha_limite` no se guarda correctamente
**Archivo:** `Backend/core/serializers.py`, `RecordatorioSerializer`  
**Síntoma:** Los recordatorios se crean pero la fecha límite aparece vacía.  
**Causa:** El campo `hora` usa `TimeField` pero MongoDB guarda strings; la serialización puede fallar silenciosamente.  
**Corrección:** Cambiar `TimeField` a `CharField` para consistencia con el modelo:

```python
# ❌ ACTUAL
hora = serializers.TimeField(required=False, allow_null=True)

# ✅ CORRECCIÓN
hora = serializers.CharField(required=False, allow_null=True, allow_blank=True)
```

**Impacto:** Los recordatorios pueden fallar al serializar si se envía hora, causando que el botón "Crear" no responda o muestre error.

---

### BUG-005 — `ReunioneSerializer`: campo `hora` como `TimeField` rechaza strings como "09:30"
**Archivo:** `Backend/core/serializers.py`  
**Síntoma:** Crear una reunión desde el panel docente falla con error 400.  
**Causa:** El frontend envía `hora` como string `"HH:MM"` pero el serializer espera un objeto `time` de Python. Ya está definido como `CharField` en `ReunioneSerializer` pero el modelo usa `hora` directamente como string, lo cual es correcto. El problema real es que **`views.py` de Reuniones no llama a `mis_cursos_docente`** para filtrar por docente, causando que no se pueda asociar la reunión al curso correcto.

**Corrección en `views.py`:** Asegurar que `ReunioneList.post` valide correctamente:

```python
# En ReunioneSerializer.create(), verificar que hora se convierta a string:
if validated_data.get('hora') and not isinstance(validated_data['hora'], str):
    validated_data['hora'] = str(validated_data['hora'])
```

---

## BLOQUE 2 – Errores en el Frontend Angular

### BUG-006 — Header móvil: elementos desordenados y sin estructura
**Archivos:** `dashboard-apoderado.page.css`, `dashboard-docente.page.css`, `admin.page.css`  
**Síntoma:** En móvil, el botón de recordatorio aparece enorme, el nombre de usuario se desborda, y el botón de cerrar sesión queda cortado (visible en Screenshot_20260409-164639).  
**Causa:** El `header-right` usa `flex-wrap: nowrap` con elementos de tamaño fijo sin `min-width: 0`.

**Corrección CSS (aplicar a los 3 dashboards):**

```css
/* ✅ NUEVO header-right */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
}

/* Ocultar texto en botones en móvil */
@media (max-width: 768px) {
  .btn-text { display: none; }
  .user-name { 
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Recordatorio: solo ícono en móvil */
  .btn-primary .btn-text { display: none; }
}
```

---

### BUG-007 — Zoom habilitado en móvil (visible en Screenshot_20260409-164639)
**Archivo:** `Frontend/src/index.html`  
**Síntoma:** El usuario puede hacer zoom en la aplicación, lo cual rompe el layout.  
**Causa:** El meta viewport no tiene `user-scalable=no` ni `maximum-scale=1`.

```html
<!-- ❌ ACTUAL -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- ✅ CORRECCIÓN -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

---

### BUG-008 — Panel docente: la vista "Cursos Asignados" no tiene estilos CSS definidos
**Archivo:** `dashboard-docente.page.css`  
**Síntoma:** Cuando el docente hace clic en "Mis Cursos", la grilla de cursos y la tabla de notas aparecen sin estilos (sin `.cursos-grid`, `.curso-card`, `.notas-table`, etc.).  
**Causa:** El HTML usa clases como `.cursos-grid`, `.curso-card`, `.notas-table`, `.nota-input`, `.promedio-cell`, `.help-text`, `.subsection-title` que **no están definidas en el CSS**.

**Agregar al CSS del dashboard docente:**

```css
/* ── CURSOS GRID ─────────────────────────────────────────── */
.cursos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.curso-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--bg-subtle);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.curso-card:hover {
  border-color: var(--brand);
  background: var(--brand-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.curso-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--brand-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.curso-icon .material-icons { color: var(--brand); font-size: 24px; }

.curso-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.curso-nivel {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--brand);
}

.curso-nombre {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.curso-asignatura {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.curso-arrow .material-icons { color: var(--text-muted); }

/* ── NOTAS TABLE ─────────────────────────────────────────── */
.notas-table-wrapper {
  overflow-x: auto;
  padding: 16px;
}

.notas-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

.notas-table th {
  padding: 10px 12px;
  background: var(--bg-subtle);
  border-bottom: 2px solid var(--border);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-align: center;
}

.notas-table th:first-child { text-align: left; }

.notas-table td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-light);
  text-align: center;
}

.notas-table tr:hover td { background: var(--bg-hover); }

.alumno-cell {
  text-align: left !important;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 160px;
}

.nota-input {
  width: 60px;
  padding: 6px 4px;
  border: 2px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color 0.2s;
  font-family: inherit;
}

.nota-input:focus {
  outline: none;
  border-color: var(--brand);
  background: var(--brand-light);
}

.nota-input:disabled {
  background: var(--bg-subtle);
  opacity: 0.5;
  cursor: not-allowed;
}

.promedio-cell {
  font-weight: 800;
  color: var(--brand);
  font-size: 1rem;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--brand-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 12px 16px;
}

.help-text .material-icons { color: var(--brand); font-size: 18px; }

.subsection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 16px 20px 8px;
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.subsection-title .material-icons { color: var(--warning); font-size: 18px; }

/* ── RESPONSIVE NOTAS ────────────────────────────────────── */
@media (max-width: 768px) {
  .cursos-grid { grid-template-columns: 1fr; padding: 12px; }
  .nota-input { width: 52px; font-size: 0.82rem; }
}
```

---

### BUG-009 — Panel docente: sección Asistencia en la vista de Cursos no existe
**Archivos:** `dashboard-docente.page.html`, `dashboard-docente.page.ts`  
**Síntoma:** Cuando el docente selecciona un curso, solo ve la tabla de notas. No hay botón de "Registrar Asistencia del día" en contexto del curso seleccionado.  
**Corrección:** Agregar al HTML de la vista `cursos`, dentro del bloque `@if (selectedCurso())`, dos tabs: "Notas" y "Asistencia".

**HTML a agregar después del `card-header` del curso seleccionado:**

```html
<!-- Tabs dentro del curso seleccionado -->
<div class="curso-tabs">
  <button class="curso-tab" [class.active]="cursoTab() === 'notas'" 
          (click)="cursoTab.set('notas')">
    <span class="material-icons">grade</span> Notas
  </button>
  <button class="curso-tab" [class.active]="cursoTab() === 'asistencia'" 
          (click)="cursoTab.set('asistencia'); loadAsistenciaCurso()">
    <span class="material-icons">how_to_reg</span> Asistencia
  </button>
</div>
```

**CSS a agregar:**
```css
.curso-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
}

.curso-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  transition: all 0.2s;
}

.curso-tab:hover { background: var(--bg-hover); color: var(--brand); }
.curso-tab.active { background: var(--brand); color: #fff; }
.curso-tab .material-icons { font-size: 16px; }
```

**TypeScript a agregar en `DashboardDocentePage`:**
```typescript
cursoTab = signal<'notas' | 'asistencia'>('notas');
asistenciaCurso = signal<Asistencia[]>([]);
asistenciaHoy: Record<string, boolean> = {};
fechaAsistenciaHoy = new Date().toISOString().split('T')[0];

loadAsistenciaCurso(): void {
  const curso = this.selectedCurso();
  if (!curso?.id) return;
  this.api.getAsistencia({ curso_id: curso.id }).subscribe(data => {
    this.asistenciaCurso.set(data);
  });
  // Pre-marcar todos como presentes
  this.estudiantes().forEach(est => {
    if (est.id) this.asistenciaHoy[est.id] = true;
  });
}

guardarAsistenciaHoy(): void {
  const curso = this.selectedCurso();
  if (!curso?.id) return;
  const registros = this.estudiantes()
    .filter(e => e.id)
    .map(e => ({ estudiante_id: e.id!, presente: this.asistenciaHoy[e.id!] ?? true }));
  
  this.saving.set(true);
  this.api.createAsistenciaBulk({
    curso_id: curso.id,
    fecha: this.fechaAsistenciaHoy,
    registros
  }).subscribe({
    next: () => {
      this.saving.set(false);
      this.showSuccess('Asistencia guardada');
      this.loadAsistenciaCurso();
    },
    error: () => { this.saving.set(false); alert('Error al guardar asistencia'); }
  });
}
```

---

### BUG-010 — `anotacionForm.estudianteId` no se filtra por curso
**Archivo:** `dashboard-docente.page.html`  
**Síntoma:** En el modal de nueva anotación, el selector de estudiantes muestra TODOS los estudiantes del sistema, no solo los del curso del docente.  
**Causa:** `this.estudiantes()` contiene todos los estudiantes cuando se abre el modal desde el dashboard general.  
**Corrección en `openAnotacionDialog()`:**

```typescript
openAnotacionDialog(): void {
  // Si hay un curso seleccionado, cargar sus estudiantes primero
  if (this.selectedCurso()?.id) {
    this.api.getEstudiantes(this.selectedCurso()!.id).subscribe(data => {
      this.estudiantes.set(data);
    });
  } else if (this.cursosAsignados().length > 0) {
    // Cargar estudiantes del primer curso asignado
    const primerCurso = this.cursosAsignados()[0];
    if (primerCurso.id) {
      this.api.getEstudiantes(primerCurso.id).subscribe(data => {
        this.estudiantes.set(data);
      });
    }
  }
  this.anotacionForm = {
    estudianteId: '',
    tipo: 'negativa',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  };
  this.showAnotacionModal.set(true);
}
```

---

### BUG-011 — Los recordatorios se crean pero no se muestran (problema de `usuario_id`)
**Archivos:** `admin.page.ts`, `dashboard-docente.page.ts`, `dashboard-apoderado.page.ts`  
**Síntoma:** Se guarda el recordatorio, el backend responde OK, pero la lista no se actualiza o aparece vacía.  
**Causa:** El `usuario_id` que se envía al backend es el `id` del usuario (`user.id`), pero cuando se hace GET con `?usuario_id=`, el backend busca en el campo `usuario_id` de MongoDB. El problema es que `auth.user()?.id` puede ser `undefined` si el campo en la respuesta del backend se llama `_id` y no `id`.

**Verificar en `AuthService`:** El usuario viene del backend como `_id` (MongoDB ObjectId), pero en el serializer se mapea a `id`. Sin embargo, si hay algún problema de serialización, `user.id` puede llegar como `undefined`.

**Corrección defensiva en todos los dashboards:**

```typescript
// ✅ Obtener ID de forma robusta
const userId = this.auth.user()?.id || (this.auth.user() as any)?._id;
if (!userId) {
  console.error('No hay userId disponible');
  return;
}
```

**En `AuthService.checkStoredAuth()`:** Asegurar que el campo `id` se mapee correctamente:

```typescript
// En login(), después de recibir response.user:
const userData = {
  ...response.user,
  id: response.user.id || (response.user as any)._id,  // normalizar
  rut: response.user.rut || undefined
};
```

---

### BUG-012 — `action-buttons` no tiene CSS definido en `dashboard-docente.page.css`
**Archivo:** `dashboard-docente.page.css`  
**Síntoma:** Los botones de editar/eliminar evaluaciones aparecen desalineados.  
**Corrección:**

```css
.action-buttons { display: flex; gap: 4px; align-items: center; }
.btn-icon.edit   { color: var(--brand); }
.btn-icon.edit:hover { background: var(--brand-light); }
.btn-icon.delete { color: var(--danger); }
.btn-icon.delete:hover { background: #fee2e2; }
```

---

## BLOQUE 3 – Mejoras de UI/UX Header (todos los paneles)

### MEJORA-001 — Reorganizar el header para versión móvil

**Problema visual** (Screenshot_20260409-164639): El header muestra en este orden:
`[≡ menú] [familia_icon] [Panel del Apoderado] ... [🔔 GRANDE] [🌙 círculo] [Barbara Toledo] [logout]`

El botón de recordatorio es demasiado grande y dominante. El nombre está entre iconos.

**Nueva estructura HTML para los 3 dashboards:**

```html
<div class="header-bar">
  <div class="header-left">
    <button class="btn-icon mobile-menu-btn" (click)="toggleMobileMenu()">
      <span class="material-icons">menu</span>
    </button>
    <span class="material-icons header-icon">family_restroom</span>
    <h1 class="header-title">Panel del Apoderado</h1>
  </div>
  
  <div class="header-right">
    <!-- Usuario: avatar + nombre (visible en desktop, solo avatar en móvil) -->
    <div class="header-user">
      <div class="user-avatar-sm">
        {{ auth.user()?.nombre?.charAt(0) }}{{ auth.user()?.apellido?.charAt(0) }}
      </div>
      <span class="user-name">{{ auth.user()?.nombre }} {{ auth.user()?.apellido }}</span>
    </div>
    
    <!-- Acciones: iconos compactos -->
    <div class="header-actions">
      <button class="header-btn" (click)="openRecordatorioDialog()" title="Nuevo Recordatorio">
        <span class="material-icons">add_alert</span>
      </button>
      <button class="header-btn" (click)="theme.toggle()" [title]="theme.isDark() ? 'Modo claro' : 'Modo oscuro'">
        <span class="material-icons">{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      <button class="header-btn danger" (click)="logout()" title="Cerrar sesión">
        <span class="material-icons">logout</span>
      </button>
    </div>
  </div>
</div>
```

**CSS nuevo para header (reemplazar en los 3 dashboards):**

```css
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 50;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.header-btn:hover {
  background: var(--bg-hover);
  color: var(--brand);
}

.header-btn.danger:hover {
  background: #fee2e2;
  color: var(--danger);
}

.header-btn .material-icons { font-size: 20px; }

/* Móvil */
@media (max-width: 768px) {
  .header-bar { padding: 0 12px; height: 56px; }
  .header-title { font-size: 0.95rem; }
  .header-icon { font-size: 20px; display: none; }
  .user-name { display: none; }  /* Solo avatar en móvil */
  .user-avatar-sm { width: 30px; height: 30px; font-size: 0.7rem; }
}
```

---

## BLOQUE 4 – Plan de implementación por prioridad

### PRIORIDAD 1 — URGENTE (bloquea funcionalidad core)
| # | Tarea | Archivo | Tiempo estimado |
|---|-------|---------|-----------------|
| 1 | Corregir typo `apoderaDo` → `apoderado` | `Backend/core/serializers.py` | 2 min |
| 2 | Reordenar rutas de notas en urls.py | `Backend/urls.py` | 5 min |
| 3 | Registrar rutas de `NotaList`/`NotaDetail` | `Backend/urls.py` | 5 min |
| 4 | Corregir mapeo de `id` en AuthService | `Frontend/src/app/core/services/auth.service.ts` | 10 min |
| 5 | Corrección defensiva `userId` en los 3 dashboards | 3 archivos `.ts` | 10 min |

### PRIORIDAD 2 — IMPORTANTE (afecta UX significativamente)
| # | Tarea | Archivo | Tiempo estimado |
|---|-------|---------|-----------------|
| 6 | Deshabilitar zoom en móvil | `Frontend/src/index.html` | 1 min |
| 7 | Nuevo diseño de header (3 dashboards) | 3 archivos `.html` + `.css` | 45 min |
| 8 | Agregar CSS faltante para Cursos/Notas docente | `dashboard-docente.page.css` | 20 min |
| 9 | Corregir `RecordatorioSerializer.hora` TimeField→CharField | `Backend/core/serializers.py` | 2 min |

### PRIORIDAD 3 — MEJORAS (experiencia completa)
| # | Tarea | Archivo | Tiempo estimado |
|---|-------|---------|-----------------|
| 10 | Agregar sección Asistencia en vista de Cursos del docente | `dashboard-docente.page.html/ts/css` | 60 min |
| 11 | Filtrar estudiantes por curso en modal de Anotaciones | `dashboard-docente.page.ts` | 15 min |
| 12 | Mejorar `action-buttons` CSS en docente | `dashboard-docente.page.css` | 5 min |
| 13 | Verificar y corregir filtro del docente en Anotaciones modal | `dashboard-docente.page.ts` | 15 min |

---

## BLOQUE 5 – Resumen de archivos a modificar

### Backend (sin tocar `settings.py`, `.env`, `database.py`, `wsgi.py`)
```
Backend/core/serializers.py    → BUG-001, BUG-004, BUG-005
Backend/urls.py                → BUG-002, BUG-003
```

### Frontend (sin tocar `environments/`, `app.config.ts`, `app.routes.ts`)
```
Frontend/src/index.html
Frontend/src/app/core/services/auth.service.ts
Frontend/src/app/pages/admin/admin.page.html
Frontend/src/app/pages/admin/admin.page.css
Frontend/src/app/pages/admin/admin.page.ts
Frontend/src/app/pages/dashboard-docente/dashboard-docente.page.html
Frontend/src/app/pages/dashboard-docente/dashboard-docente.page.css
Frontend/src/app/pages/dashboard-docente/dashboard-docente.page.ts
Frontend/src/app/pages/dashboard-apoderado/dashboard-apoderado.page.html
Frontend/src/app/pages/dashboard-apoderado/dashboard-apoderado.page.css
Frontend/src/app/pages/dashboard-apoderado/dashboard-apoderado.page.ts
```

### NO TOCAR
```
Frontend/src/environments/environment.prod.ts  ← URL de producción del backend
Frontend/functions/api.ts                      ← Worker proxy de Cloudflare
Backend/core/database.py                       ← Conexión MongoDB Atlas
Backend/settings.py                            ← Configuración Django
```

---

## BLOQUE 6 – Verificación post-corrección

Después de aplicar los cambios, verificar en este orden:

1. **Backend local:** `python manage.py runserver` → acceder a `/notas` y `/recordatorios`
2. **Crear recordatorio:** Panel Admin → botón "Recordatorio" → verificar que aparece en la lista
3. **Crear anotación:** Panel Docente → "Nueva Anotación" → seleccionar estudiante → guardar
4. **Guardar nota:** Panel Docente → Mis Cursos → seleccionar curso → editar nota → TAB fuera del campo
5. **Zoom móvil:** Abrir en Chrome Android → intentar hacer zoom → no debe ser posible
6. **Header móvil:** Verificar que todos los botones del header son visibles y alineados en pantalla de 360px

---

*Este documento fue generado tras análisis completo del código fuente. Todas las correcciones son quirúrgicas y no afectan la arquitectura de producción existente.*
