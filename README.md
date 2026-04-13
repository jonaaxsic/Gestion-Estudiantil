# Gestión Estudiantil

<div align="center">

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)

</div>

---

## 📱 Descripción

Aplicación web para la gestión académica institucional que permite digitalizar procesos de asistencia, evaluaciones, anotaciones y comunicación entre docentes, estudiantes y apoderados.

---

## 🛠️ Tecnologías

| Categoría         | Tecnología                      |
| ----------------- | ------------------------------- |
| **Frontend**      | Angular 19 + Angular Material   |
| **Backend**       | Python + Django (Serverless)    |
| **Base de Datos** | MongoDB Atlas                   |
| **Despliegue**    | Cloudflare Pages Workers + Render   |
| **Desarrollo**    | TypeScript, Python, Django     |

---

## 📁 Estructura del Proyecto

```
Gestion-Estudiantil/
├── Frontend/          # Aplicación Angular
│   └── src/           # Código fuente
├── Backend/           # API Django REST
│   └── core/          # Modelos, vistas, serializadores
├── api-worker/        # Cloudflare Workers (proxy API)
└── docs/              # Documentación adicional
```

---

## ✨ Características

- 📊 **Registro de Asistencia** - Control diario de presencia por curso
- 📅 **Calendario de Evaluaciones** - Programación y notificaciones de pruebas
- 📝 **Anotaciones** - Registro de comportamiento positivo y negativo
- 📢 **Reuniones** - Gestión de reuniones de apoderados
- 👥 **Gestión de Roles** - Admin, Docente, Apoderado

---

## 🚀 Despliegue

| Servicio | URL |
|----------|-----|
| **Frontend** | Cloudflare Pages |
| **API** | Cloudflare Workers → Render |

> ⚠️ **Nota**: El backend en Render (plan free) entra en modo sleep tras 15 min de inactividad. Se recomienda configurar un servicio de ping (cron-job.org) cada 15 min para mantenerlo activo.

---

## 🎯 Soluciones Entregadas

- **Digitalización documental** - Eliminación de papel en procesos académicos
- **Comunicación centralizada** - Un canal para todas las notificaciones
- **Acceso remoto** - Información disponible desde cualquier dispositivo
- **Interfaz responsive** - Compatible con móviles y desktop

---

## 📬 Contacto

**Jonathan Anomisar**

- 📧 jonathan.anomisar@gmail.com
- 💻 [GitHub](https://github.com/jonaaxsic)
