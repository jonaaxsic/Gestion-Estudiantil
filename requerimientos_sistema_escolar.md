# Requerimientos de Mejora – Sistema de Gestión Escolar

## 1. Seguridad
- Mejorar la seguridad general del sistema.
- Implementar protecciones contra vulnerabilidades de hacking (ej: XSS, SQL Injection, autenticación robusta).

---

## 2. Panel de Administrador – UI/UX

### 2.1 Filtro de usuarios (móvil)
- En el panel de administrador, la sección de filtros (Usuarios / Estudiantes / Cursos) presenta un problema de alineación en versiones móviles.
- El botón "Cursos" está desplazado hacia la orilla y no está centrado correctamente.
- **Acción requerida:** Corregir el centrado y espaciado del botón "Cursos" en vistas responsive/móvil.

---

## 3. Gestión de Docentes
- Mejorar la lógica para asignar un docente a un curso junto con su asignatura.
- **Ejemplo:** Profesor Jonathan Rodríguez → asignatura: Historia → curso: 3°B.
- El administrador debe poder crear docentes y asignarles curso + asignatura desde el panel.

---

## 4. Gestión de Apoderados y Pupilos

### 4.1 Creación y asignación
- El administrador puede crear un apoderado y asignarle un pupilo/alumno.
- El apoderado también debe poder registrar a su hijo desde su propio panel (ya sea creando un nuevo alumno o asignando uno existente).
- **Decisión de diseño a evaluar:** ¿Dónde se crea el pupilo? Opciones:
  - Solo en el panel del administrador.
  - Solo en el panel del apoderado.
  - En ambos paneles (recomendado con validaciones para evitar duplicados).

### 4.2 Edad y progresión escolar
- Al registrar un hijo/pupilo, se debe asignar su edad y curso actual.
- Implementar lógica de progresión escolar:
  - Un niño entra a 1° básico con 5 o 6 años.
  - Al finalizar el año escolar, si cumple los requisitos (notas + asistencia), pasa al siguiente curso.
  - Al pasar de curso, el alumno puede cumplir años dentro del nuevo nivel (ej: en 2° básico puede tener 6, 7 u 8 años según el caso).
  - Esta lógica debe aplicarse sucesivamente para cada nivel escolar.

---

## 5. Gestión de Cursos

### 5.1 Panel lateral de cursos
Crear un panel lateral en el dashboard que muestre la lista de cursos disponibles. Las acciones disponibles varían según el rol:

| Acción | Administrador | Docente |
|---|:---:|:---:|
| Crear nuevos cursos | ✅ | ❌ |
| Ver lista de estudiantes del curso | ✅ | ✅ |
| Registrar y guardar asistencia por curso | ✅ | ✅ |
| Registrar notas de pruebas/evaluaciones por alumno | ✅ | ✅ |

> **Nota:** El docente solo puede ver y gestionar los cursos que tiene asignados. No tiene permisos para crear, editar ni eliminar cursos.

---

## 6. Notas de Recordatorio 📝
- Implementar un módulo de notas de recordatorio dentro del dashboard.
- Debe estar disponible para **todos los roles**: administrador, docente, apoderado y alumno.

---

## 7. Mejoras Generales por Panel
Implementar en cada panel de usuario:
- Notas de recordatorio.
- Menú con opciones mejoradas y navegación clara.
- Mejoras en la asignación de roles y sub-usuarios (apoderados, pupilos).
- Asignación de docentes a cursos con su asignatura correspondiente.

---

## 8. Base de Datos

### 8.1 Reestructuración
- Revisar y modificar la base de datos para soportar todas las nuevas funcionalidades.
- Evitar duplicación de datos: no cargar todos los usuarios en una sola tabla genérica.
- Crear tablas específicas:
  - `docentes` – datos propios del rol docente.
  - `apoderados` – datos propios del rol apoderado.
  - `alumnos` – con campo de edad, curso actual y año de ingreso.
  - `asignaciones_docente_curso` – relación docente ↔ curso ↔ asignatura.
  - `asistencia` – registro por curso, fecha y alumno.
  - `notas` – evaluaciones por alumno y asignatura.
  - `recordatorios` – notas por usuario y rol.

### 8.2 Objetivo final
El sistema debe funcionar como un **Sistema de Gestión Escolar completo**, con coherencia entre roles, datos y funcionalidades.
