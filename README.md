# 📦 Stock App (Domestic Stock Management)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

Stock App es una aplicación web full-stack (SPA) diseñada para gestionar el inventario doméstico de productos de uso diario (limpieza, alimentos, bebidas, etc.) de forma colaborativa mediante grupos familiares.

## ✨ Características Principales

* **Autenticación Segura:** Sistema de registro e inicio de sesión protegido con JSON Web Tokens (JWT).
* **Grupos Familiares:** Creación de grupos e invitación de miembros mediante nombre de usuario para compartir el inventario.
* **Gestión de Inventario en Tiempo Real:** * Creación, edición y eliminación de productos.
  * Alertas visuales automáticas para productos con "stock bajo" o "sin stock".
  * Filtros por categoría, barra de búsqueda y opciones de ordenamiento (A-Z, por cantidad).
* **Lista de Compras Inteligente:**
  * Sincronización automática de productos que necesitan reabastecimiento.
  * Exportación de la lista agrupada por categorías (ideal para enviar por WhatsApp).
  * Registro rápido de compras que actualiza el stock automáticamente.
* **Experiencia de Usuario (UX/UI):**
  * Interfaz limpia y responsiva.
  * Soporte para Modo Claro ☀️ y Modo Oscuro 🌙.
  * Notificaciones "Toast" fluidas para informar sobre el éxito o error de las acciones.

## 🛠️ Stack Tecnológico

**Frontend:**
* React.js (Single Page Application)
* React Router DOM (Navegación)
* Axios (Peticiones HTTP)
* React Hot Toast (Notificaciones)

**Backend:**
* Python 3
* FastAPI
* Motor (Driver asíncrono para MongoDB)
* Passlib & Jose (Cifrado y JWT)

**Base de Datos:**
* MongoDB Atlas (Cloud Database)

## 🚀 Instalación y Ejecución Local

Sigue estos pasos para correr el proyecto en tu máquina local.

### Prerrequisitos
* Node.js y npm instalados.
* Python 3.8 o superior.
* Una cuenta en MongoDB Atlas con una base de datos configurada.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TU_USUARIO/domestic-stock-management.git](https://github.com/TU_USUARIO/domestic-stock-management.git)
cd domestic-stock-management
```

### 2. Configurar y levantar el Backend

# Crear un entorno virtual
python -m venv venv

# Activar el entorno virtual
# En Windows:
.\venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar las dependencias
pip install -r requirements.txt

# Levantar el servidor de desarrollo
python -m uvicorn backend.app.main:app --reload

*El backend estará corriendo en http://localhost:8000*

### 3. Configurar y levantar el Frontend
Abre una **nueva terminal** y ejecuta:

# Navegar a la carpeta del frontend
cd frontend

# Instalar las dependencias de Node
npm install

# Levantar la aplicación de React
npm start

*El frontend se abrirá automáticamente en tu navegador en http://localhost:3000*

## 📱 Acceso desde la Red Local (Móvil)
Para probar la aplicación en tu celular conectado al mismo Wi-Fi:
1. Levanta el backend exponiendo tu IP local: "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"
2. En "frontend/src/services/api.js", cambia "localhost" por la dirección IPv4 de tu computadora.
3. Accede desde el navegador de tu celular a "http://TU_IP_LOCAL:3000".

## 🤝 Contribuciones
Este es un proyecto de código abierto. Si deseas contribuir, por favor haz un fork del repositorio, crea una nueva rama para tu funcionalidad y envía un Pull Request.

---
*Desarrollado con el objetivo de facilitar la organización del hogar.*
