# Proyecto: Digitalización de Procesos Internos Estudiantiles

## 1. Descripción General del Proyecto

Se requiere el desarrollo de un aplicativo web para la **digitalización de procesos internos estudiantiles**, orientado a mejorar la comunicación, gestión académica y seguimiento de los estudiantes.

El sistema permitirá a docentes y apoderados acceder a información clave como:

- Registro de asistencia
- Calendario de evaluaciones
- Anotaciones (positivas/negativas)
- Notificaciones de reuniones de apoderados
- Comunicación institucional

---

## 2. Objetivo del Proyecto

Desarrollar un **MVP (Producto Mínimo Viable)** funcional que permita validar la solución con usuarios reales (docentes y apoderados), optimizando la gestión académica y la comunicación escolar.

---

## 3. Usuarios y Roles del Sistema

### 👨‍🏫 Docente

- Registrar asistencia.
- Crear evaluaciones.
- Generar anotaciones.
- Programar reuniones.

### 👪 Apoderado

- Visualizar asistencia del estudiante.
- Ver calendario de evaluaciones.
- Recibir notificaciones.
- Revisar anotaciones.

### ⚙️ Administrador (Opcional en MVP)

- Gestión de usuarios.
- Configuración del sistema.

---

## 4. Ciclo de Vida del Software

Se aplicará un ciclo iterativo basado en metodologías ágiles:

1. Levantamiento de requerimientos
2. Análisis y diseño
3. Desarrollo incremental
4. Pruebas
5. Entrega de MVP
6. Feedback de usuarios
7. Iteración y mejoras

---

## 5. Metodologías Ágiles

### Scrum

- **Sprints:** 2 semanas.
- **Roles:** Product Owner, Scrum Master, Equipo de desarrollo.
- **Artefactos:** Product Backlog, Sprint Backlog, Incremento.

### Kanban

- **Flujo de trabajo:** Pendiente → En desarrollo → En revisión → Terminado.

---

## 6. Historias de Usuario (Ejemplos)

| Rol           | Historia de Usuario                                                                             |
| :------------ | :---------------------------------------------------------------------------------------------- |
| **Docente**   | Como docente, quiero registrar la asistencia diaria para llevar control de los estudiantes.     |
| **Docente**   | Como docente, quiero crear evaluaciones para informar a los apoderados.                         |
| **Apoderado** | Como apoderado, quiero ver la asistencia de mi hijo para monitorear su asistencia.              |
| **Apoderado** | Como apoderado, quiero recibir notificaciones de reuniones para estar informado.                |
| **Sistema**   | Como sistema, quiero enviar notificaciones automáticas para mantener informados a los usuarios. |

---

## 7. Diseño UX/UI

- **Mapa de Empatía:** Análisis de necesidades y preocupaciones del apoderado.
- **Lienzo Canvas:** Propuesta de valor basada en comunicación clara y rápida.
- **Mockups:** Pantallas de inicio, panel de apoderado y panel de docente.
- **Diagramas:** \* UML (Casos de uso) para interacciones de actores.
  - Diagramas de flujo para procesos como el registro de asistencia.

---

## 8. Arquitectura Tecnológica

- **Frontend:** Angular con Angular Material.
- **Backend:** Django (API REST).
- **Base de Datos:** MongoDB.
- **Arquitectura:** Cliente → API REST → Base de datos.

---

## 9. Gestión de Roles y Flujos

### Flujo Docente

`Login` → `Gestión de Asistencia` → `Evaluaciones` → `Anotaciones` → `Reuniones`.

### Flujo Apoderado

`Login` → `Dashboard de Datos` → `Notificaciones` → `Calendario`.

---

## 10. Estrategia de Pruebas

- Pruebas funcionales.
- Pruebas con usuarios reales (beta testers).
- Ciclos de feedback continuo y ajustes.

---

## 11. Alcance del MVP

### ✅ Incluido

- Registro de asistencia.
- Visualización de calendario.
- Anotaciones.
- Notificaciones básicas.

### ❌ No Incluido (Fase Futura)

- App móvil nativa.
- Integraciones con sistemas externos.
- Módulo de analítica avanzada.

---

## 12. Indicadores de Éxito

- Nivel de adopción/uso del sistema.
- Índice de satisfacción del usuario.
- Reducción cuantificable de procesos manuales.
- Efectividad en la comunicación institucional.

---

## 13. Plan Inicial (Roadmap)

- **Sprint 1:** Login + Estructura base del proyecto.
- **Sprint 2:** Módulo de Asistencia.
- **Sprint 3:** Calendario de Evaluaciones.
- **Sprint 4:** Sistema de Notificaciones.
- **Sprint 5:** Pruebas finales y ajustes de UI.

---

## 14. Estructura del proyecto

el proyecto esta estructurado en 2 carpetas App_estudiantil
Backend => para python
Frontend => para Angular en el http://localhost:4200/

la base de datos es un cluster en mongo bd y se llama
con una conexion directa
puedes usar el mcp server de mongo para conectarte o el pluguins
mongodb+srv://jonaaxsic:<Diegosalvador15$>@main-database.rpaamyh.mongodb.net/?appName=Main-Database




## 15. Conclusión

Este aplicativo modernizará la gestión educativa, eliminando barreras de comunicación mediante una solución digital escalable, eficiente y centrada plenamente en el usuario.
