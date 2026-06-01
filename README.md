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
| **Frontend**      | Angular 21 + Angular Material   |
| **Backend**       | Python + Django REST Framework  |
| **Base de Datos** | MongoDB Atlas                   |
| **Despliegue**    | Cloudflare Pages + Render       |
| **Desarrollo**    | TypeScript, Python, Django      |

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

## ⚙️ Requisitos Previos

Antes de levantar el proyecto asegúrate de tener instalado:

- **Node.js** v20 o superior → [nodejs.org](https://nodejs.org)
- **Bun** (gestor de paquetes del frontend) → `npm install -g bun`
- **Python** 3.11 o superior → [python.org](https://python.org)
- **pip** (incluido con Python)
- **Git**

---

## 🚀 Cómo Levantar el Proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/jonaaxsic/gestion-estudiantil.git
cd gestion-estudiantil
```

---

### 🐍 Backend (Django + MongoDB)

#### Paso 1 — Crear y activar el entorno virtual

```bash
cd Backend

# Crear entorno virtual
python -m venv venv

# Activar en Linux/macOS
source venv/bin/activate

# Activar en Windows
venv\Scripts\activate
```

#### Paso 2 — Instalar dependencias

```bash
pip install -r requirements.txt
```

#### Paso 3 — Configurar variables de entorno

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus datos de MongoDB Atlas:

```env
SECRET_KEY=tu-clave-secreta-segura
DEBUG=True
ALLOWED_HOSTS=*

# Opción A: URI completa (recomendado)
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?appName=Main-Database

# Opción B: Variables separadas
MONGO_USER=tu-usuario
MONGO_PASSWORD=tu-contraseña
MONGO_HOST=tu-cluster.mongodb.net
MONGO_DB_NAME=App_estudiantil
```

#### Paso 4 — Verificar conexión a MongoDB

```bash
python manage.py check_mongo
```

#### Paso 5 — Levantar el servidor de desarrollo

```bash
python manage.py runserver
```

El backend quedará disponible en **http://127.0.0.1:8000**

> **Endpoints principales:**
> - `GET /` → Estado de la API
> - `GET /health` → Health check
> - `POST /auth/login` → Autenticación
> - `GET /usuarios`, `GET /estudiantes`, `GET /cursos` → CRUD general

---

### 🅰️ Frontend (Angular)

#### Paso 1 — Instalar dependencias

```bash
cd Frontend
bun install

# Si no tienes Bun, también puedes usar npm:
npm install
```

#### Paso 2 — Configurar el entorno de desarrollo

El archivo `src/environments/environment.ts` apunta por defecto al backend local:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000'
};
```

No necesitas modificarlo si levantaste el backend en el paso anterior.

#### Paso 3 — Levantar el servidor de desarrollo

```bash
Dentro del directorio /Frontend en consola 
ng serve
```

La aplicación quedará disponible en **http://localhost:4200**

> El servidor recarga automáticamente al guardar cambios en el código.

---

### 🐳 Levantar con Docker (alternativa)

Si prefieres usar Docker, puedes levantar ambos servicios juntos:

```bash
# En la raíz del proyecto
docker-compose up --build
```

| Servicio   | URL                       |
|------------|---------------------------|
| Frontend   | http://localhost:80        |
| Backend    | http://localhost:8000      |

Para detener:

```bash
docker-compose down
```

---

## 👤 Usuarios de Prueba

Para crear un usuario administrador de prueba usa el endpoint:

```bash
curl -X POST http://127.0.0.1:8000/auth/create-test-user
```

O puedes crear usuarios directamente desde el panel de administración una vez autenticado.

**Roles disponibles:**
| Rol            | Dashboard                   |
|----------------|-----------------------------|
| administrador  | `/admin`                    |
| docente        | `/dashboard-docente`        |
| apoderado      | `/dashboard-apoderado`      |

---

## ✨ Características

- 📊 **Registro de Asistencia** — Control diario de presencia por curso
- 📅 **Calendario de Evaluaciones** — Programación y notificaciones de pruebas
- 📝 **Anotaciones** — Registro de comportamiento positivo y negativo
- 📢 **Reuniones** — Gestión de reuniones de apoderados
- 📓 **Notas** — Ingreso y seguimiento de calificaciones por asignatura
- 👥 **Gestión de Roles** — Admin, Docente, Apoderado
- 🌙 **Modo Oscuro/Claro** — Tema adaptable al sistema

---

## 🚀 Despliegue en Producción

| Servicio     | Plataforma        | URL de ejemplo                              |
|--------------|-------------------|---------------------------------------------|
| **Frontend** | Cloudflare Pages  | `gestionestudiantil.pages.dev`              |
| **Backend**  | Render.com        | `gestion-estuduantil.onrender.com`          |

### Deploy del Frontend

```bash
cd Frontend
npm run build:cloudflare
npx wrangler pages deploy ./dist/cloudflare/browser --project-name gestionestudiantil
```

### Deploy del Backend

El backend se despliega automáticamente en Render al hacer push a `main`. Configura las variables de entorno en el panel de Render tal como están en `.env.example`.

---

## 📬 Contacto

**Jonathan Anomisar**

- 📧 jonathan.anomisar@gmail.com
- 💻 [GitHub](https://github.com/jonaaxsic)
