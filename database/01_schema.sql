IF DB_ID('reuse_campus_db') IS NULL
BEGIN
    CREATE DATABASE reuse_campus_db;
END
GO

USE reuse_campus_db;
GO

-- 1. USUARIOS
IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(120) NOT NULL,
        correo NVARCHAR(150) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        rol NVARCHAR(20) NOT NULL CONSTRAINT DF_Usuarios_Rol DEFAULT 'Usuario',
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Usuarios_Estado DEFAULT 'ACTIVO',
        CONSTRAINT CK_Usuarios_Rol CHECK (rol IN ('Usuario', 'Administrador')),
        CONSTRAINT CK_Usuarios_Estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
    );
END
GO

-- 2. PUBLICACIONES
IF OBJECT_ID('dbo.Publicaciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Publicaciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        titulo NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(MAX) NOT NULL,
        categoria NVARCHAR(80) NOT NULL,
        modalidad NVARCHAR(20) NOT NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Publicaciones_Estado DEFAULT 'DISPONIBLE',
        fechaPublicacion DATETIME2(0) NOT NULL CONSTRAINT DF_Publicaciones_Fecha DEFAULT SYSDATETIME(),
        usuarioId INT NOT NULL,
        CONSTRAINT FK_Publicaciones_Usuarios FOREIGN KEY (usuarioId) REFERENCES dbo.Usuarios(id),
        CONSTRAINT CK_Publicaciones_Modalidad CHECK (modalidad IN ('DONACIÓN', 'INTERCAMBIO')),
        CONSTRAINT CK_Publicaciones_Estado CHECK (estado IN ('DISPONIBLE', 'RESERVADA', 'ENTREGADA', 'CANCELADA'))
    );
END
GO

-- 3. SOLICITUDES
IF OBJECT_ID('dbo.Solicitudes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Solicitudes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        publicacionId INT NOT NULL,
        solicitanteId INT NOT NULL,
        mensaje NVARCHAR(500) NOT NULL,
        fechaSolicitud DATETIME2(0) NOT NULL CONSTRAINT DF_Solicitudes_Fecha DEFAULT SYSDATETIME(),
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Solicitudes_Estado DEFAULT 'PENDIENTE',
        CONSTRAINT FK_Solicitudes_Publicaciones FOREIGN KEY (publicacionId) REFERENCES dbo.Publicaciones(id),
        CONSTRAINT FK_Solicitudes_Usuarios FOREIGN KEY (solicitanteId) REFERENCES dbo.Usuarios(id),
        CONSTRAINT CK_Solicitudes_Estado CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'))
    );
END
GO

-- 4. ENTREGAS / INTERCAMBIOS
IF OBJECT_ID('dbo.EntregasIntercambios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EntregasIntercambios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        publicacionId INT NOT NULL,
        solicitudId INT NOT NULL,
        propietarioId INT NOT NULL,
        receptorId INT NOT NULL,
        fechaAcuerdo DATETIME2(0) NOT NULL CONSTRAINT DF_Entregas_FechaAcuerdo DEFAULT SYSDATETIME(),
        fechaEntrega DATETIME2(0) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Entregas_Estado DEFAULT 'PENDIENTE',
        CONSTRAINT FK_Entregas_Publicaciones FOREIGN KEY (publicacionId) REFERENCES dbo.Publicaciones(id),
        CONSTRAINT FK_Entregas_Solicitudes FOREIGN KEY (solicitudId) REFERENCES dbo.Solicitudes(id),
        CONSTRAINT FK_Entregas_Propietario FOREIGN KEY (propietarioId) REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_Entregas_Receptor FOREIGN KEY (receptorId) REFERENCES dbo.Usuarios(id),
        CONSTRAINT CK_Entregas_Estado CHECK (estado IN ('PENDIENTE', 'COMPLETADA'))
    );
END
GO