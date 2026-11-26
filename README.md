# ReUse Campus

Aplicación web full-stack de economía circular para la donación e intercambio de artículos y materiales dentro de la comunidad educativa. Permite publicar recursos, gestionar solicitudes con reglas de negocio validadas en servidor y controlar el ciclo de vida completo hasta la entrega efectiva.

- **Autor:** Vicente Ignacio Olmos Zapata
- **Carrera:** Ingeniería en Informática — Instituto Profesional Virginio Gómez (Sede Chillán)
- **Asignatura:** Electivo Angular

## Stack Tecnológico
- **Base de datos:** Microsoft SQL Server (`reuse_campus_db`) con 4 entidades relacionadas (`Usuarios`, `Publicaciones`, `Solicitudes`, `EntregasIntercambios`).
- **Backend:** Node.js + Express (`mssql` / `msnodesqlv8`).
- **Frontend:** Angular 22 (Standalone Components, `Router`, `HttpClient`, `FormsModule`, Signals).

## Estructura General de la Solución

```text
Proyecto-ReUse-FullStack/
├── database/                  # Scripts SQL de creación de tablas, relaciones y datos semilla
├── backend/                   # API REST en Node.js + Express, transacciones y reglas de negocio
│   ├── src/
│   └── .env.example
└── frontend/                  # Aplicación SPA en Angular 22
    └── src/
        ├── styles.css         # Estilos globales, variables de marca y tarjetas compartidas
        └── app/
            ├── components/
            │   ├── login/         # Autenticación y manejo de errores de acceso
            │   ├── dashboard/     # Layout privado, barra de sesión y navegación por pestañas
            │   ├── catalogo/      # Creación, filtrado y solicitud de publicaciones
            │   ├── solicitudes/   # Revisión, aceptación y reserva de artículos
            │   └── entregas/      # Seguimiento y cierre de entregas e intercambios
            ├── guards/            # Protección de rutas privadas (authGuard)
            ├── models/            # Interfaces TypeScript del dominio
            └── services/          # Comunicación HTTP (ReuseApiService) y sesión (AuthService)
```

## Flujo de Estados y Reglas de Negocio Implementadas
1. **Autenticación y Control de Acceso:** Inicio de sesión con validación de credenciales y estado de cuenta (`ACTIVO` / `BLOQUEADO`), protección de `/dashboard` mediante `authGuard` y restricción de acciones tanto en la interfaz como en el backend.
2. **Publicaciones (`Publicaciones`):** Creación en modalidad `DONACIÓN` o `INTERCAMBIO` iniciando en estado `DISPONIBLE`, con filtros dinámicos por estado y modalidad.
3. **Solicitudes (`Solicitudes`):** Envío de solicitudes en estado `PENDIENTE` únicamente sobre publicaciones `DISPONIBLE` pertenecientes a otros usuarios, impidiendo auto-solicitudes y solicitudes pendientes duplicadas del mismo usuario.
4. **Aceptación y Reserva (`PATCH /api/solicitudes/:id/aceptar`):** Transacción SQL en backend que valida la propiedad del artículo, marca la solicitud elegida como `ACEPTADA`, rechaza automáticamente las demás solicitudes `PENDIENTE` asociadas a la publicación, cambia la publicación a `RESERVADA` y genera un registro en `EntregasIntercambios` en estado `PENDIENTE`.
5. **Cierre de Entrega (`PATCH /api/entregas/:id/completar`):** Transacción SQL en backend que actualiza la entrega a `COMPLETADA` registrando `fechaEntrega` y cambia el estado final de la publicación a `ENTREGADA`.

## Cómo Ejecutar el Proyecto

### 1. Base de Datos y Backend
1. Ejecuta el script de esquema y datos iniciales de `database/` en SQL Server (`reuse_campus_db`).
2. Configura las variables de entorno en `backend/.env` a partir de `backend/.env.example`.
3. Instala dependencias y levanta el servidor:

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (Angular 22)
1. Instala dependencias y levanta la aplicación Angular:

```bash
cd frontend
npm install
ng serve -o
```

## Pruebas Realizadas
- **Flujo funcional completo:** Inicio de sesión con usuario `ACTIVO`, creación de publicación (`DISPONIBLE`), envío de solicitudes desde otras cuentas, aceptación por parte del propietario (cambio de publicación a `RESERVADA`, rechazo de solicitudes restantes y creación de entrega `PENDIENTE`) y confirmación de entrega (`COMPLETADA` / `ENTREGADA`), comprobando persistencia en SQL Server tras recargar la aplicación.
- **Control de acceso y roles/estados:** Intento de navegación directa a `/dashboard` sin sesión activa (redirección a `/login`) y prueba con cuenta en estado `BLOQUEADO` (controles deshabilitados en frontend y operaciones rechazadas por el backend).
- **Validaciones y situaciones inválidas:** Envío de formularios incompletos, intento de solicitar publicaciones propias, duplicadas o en estado `RESERVADA`/`ENTREGADA`, y visualización de mensajes de error claros ante respuestas fallidas de la API.

## Declaración de Uso de Inteligencia Artificial
En cumplimiento con las normas de integridad académica de la evaluación, se declara el uso de herramientas de inteligencia artificial durante el desarrollo del proyecto:

- **Herramienta utilizada:** Google Gemini.
- **Tareas concretas en las que se utilizó:**
  - Apoyo en la refactorización de la vista monolítica inicial (`app.html`) hacia una arquitectura modular en Angular 22 con componentes independientes (`Login`, `Dashboard`, `Catalogo`, `Solicitudes`, `Entregas`), enrutamiento y `authGuard`.
  - Estructuración de estilos globales (`styles.css`) y hojas de estilo encapsuladas por componente.
  - Depuración de errores de compilación de plantillas en Angular (`NG8001` por importaciones de componentes standalone) y redacción estructurada de la documentación.
- **Partes propuestas con apoyo de IA vs. intervención del estudiante:**
  - La IA propuso la división de plantillas/componentes, la estructura base de hojas de estilo y el formato de documentación del `README.md`.
  - El estudiante diseñó e implementó el modelo relacional en SQL Server (`reuse_campus_db`), los endpoints y transacciones SQL en Node.js/Express, los servicios (`AuthService`, `ReuseApiService`), además de integrar, transcribir, adaptar y corregir manualmente los componentes, rutas y estilos en el entorno local.
- **Verificación:** Todas las funcionalidades y reglas de negocio fueron verificadas ejecutando localmente SQL Server, el servidor Express y `ng serve`, probando cada transición de estado, restricción de usuario y mensaje de error directamente en la aplicación.