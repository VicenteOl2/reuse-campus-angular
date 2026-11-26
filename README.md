# ReUse Campus

Aplicación web full-stack para la donación e intercambio de artículos y materiales dentro del campus universitario.

## Stack Tecnológico
- **Base de datos:** Microsoft SQL Server (`reuse_campus_db`)
- **Backend:** Node.js + Express (`mssql` / `msnodesqlv8`)
- **Frontend:** Angular 22 (`HttpClient`, `FormsModule`, Signals)

## Flujo de Estados y Transacciones
1. **Publicación (`Publicaciones`):** modalidad `DONACIÓN` o `INTERCAMBIO`; inicia en estado `DISPONIBLE`.
2. **Solicitud (`Solicitudes`):** un usuario solicita una publicación disponible en estado `PENDIENTE`.
3. **Aceptación (`PATCH /api/solicitudes/:id/aceptar`):** transacción SQL que acepta la solicitud, pasa la publicación a `RESERVADA` y crea un registro en `EntregasIntercambios` en estado `PENDIENTE`.
4. **Entrega (`PATCH /api/entregas/:id/completar`):** transacción SQL que marca la entrega como `COMPLETADA` (con `fechaEntrega`) y actualiza la publicación a `ENTREGADA`.

## Cómo Ejecutar el Proyecto

### 1. Base de Datos y Backend
1. Ejecuta el script de esquema en SQL Server (`reuse_campus_db`).
2. Configura las variables de entorno en `backend/.env` (a partir de `backend/.env.example`).
3. Instala dependencias y levanta el servidor:
   ```bash
   cd backend
   npm install
   npm run dev

2. Frontend (Angular 22)
   ```bash
   cd frontend
npm install
ng serve -o